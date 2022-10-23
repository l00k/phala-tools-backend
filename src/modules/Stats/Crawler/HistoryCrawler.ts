import { Network } from '#/App/Domain/Type/Network';
import { AppState } from '#/BackendCore/Domain/Model/AppState';
import * as Phala from '#/Phala';
import { KhalaTypes } from '#/Phala';
import * as Polkadot from '#/Polkadot';
import { HistoryCrawlerState } from '#/Stats/Domain/Model/AppState/HistoryCrawlerState';
import { HistoryEntry } from '#/Stats/Domain/Model/HistoryEntry';
import { NetworkState } from '#/Stats/Domain/Model/NetworkState';
import { Snapshot } from '#/Stats/Domain/Model/Snapshot';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import { Worker, WorkerState } from '#/Stats/Domain/Model/Worker';
import { AbstractCrawler } from '#/Stats/Service/AbstractCrawler';
import { Config } from '@inti5/configuration';
import { RuntimeException } from '@inti5/utils/Exception';
import * as ORM from '@mikro-orm/core';
import { ApiPromise } from '@polkadot/api';
import colors from 'colors';
import range from 'lodash/range';
import moment from 'moment';


const sleep = (ms : number) => new Promise(resolve => setTimeout(resolve, ms));


export class HistoryCrawler
    extends AbstractCrawler
{
    
    public static readonly HISTORY_ENTRY_INTERVAL = 1;
    
    protected static readonly HALVING_FRACTION = 0.75;
    protected static readonly BLOCK_INTERVAL = 2048;
    
    protected static readonly TARGET_BLOCK_TIME = 12;
    protected static readonly CONFIDENCE_SCORE_MAP = {
        1: 1,
        2: 1,
        3: 1,
        4: 0.8,
        5: 0.7
    };
    protected static readonly GEMINI_UPGRADE_BLOCKHEIGHT = 1467000;
    
    
    @Config('modules.app.network')
    protected _network : Network;
    
    
    protected _apiAt : ApiPromise;
    
    protected _appStateClass : any = HistoryCrawlerState;
    protected _appState : AppState<HistoryCrawlerState>;
    
    protected _snapshot : Snapshot;
    protected _isFinalized : boolean;
    protected _tokenomicParameters : typeof KhalaTypes.TokenomicParameters;
    
    protected _stakePoolsCount : number = 0;
    protected _processedStakePools : StakePoolEntry[] = [];
    protected _sortedStakePools : StakePoolEntry[] = [];
    protected _specialStakePools : { [id : number] : StakePoolEntry } = {};
    
    protected _workers : Worker[] = [];
    
    
    protected async _process ()
    {
        this._txEntityManager = this._entityManager;
        
        // create snapshots
        await this._createSnapshots();
        
        // process entries
        const component = process.argv[2];
        const maxEntries = component === 'cli'
            ? 100000
            : 3;
        
        await this._processHistory(maxEntries);
    }
    
    protected async _createSnapshots () : Promise<void>
    {
        this._logger.log('Processing snapshots');
        
        let lastSnapshot : Snapshot = await this._entityManager.getRepository(Snapshot)
            .findOne(
                { id: { $gt: 0 } },
                {
                    orderBy: { id: ORM.QueryOrder.DESC }
                }
            );
        if (!lastSnapshot) {
            lastSnapshot = new Snapshot({
                blockNumber: 414489,
                blockHash: '0x9b0b835052df9e78d1be0fa8730e395f80e24e259733f531aa2584643f16e6bb',
                date: moment.utc('2021-09-18T00:00:00').toDate(),
            }, this._entityManager);
            this._entityManager.persist(lastSnapshot);
        }
        
        while (true) {
            const nextEntryMoment = moment.utc(lastSnapshot.date)
                .hour(0).minute(0).second(0).millisecond(0)
                .add(1, 'day');
            
            const dateThresholdMoment = moment.utc().subtract(5, 'minutes');
            if (nextEntryMoment.isAfter(dateThresholdMoment)) {
                break;
            }
            
            // find first block of next entry
            const nextEntryDate = nextEntryMoment.toDate();
            const nextEntryBlockNumber = await this._findFirstBlockOfEntry(
                nextEntryDate,
                lastSnapshot.blockNumber,
            );
            
            if (!nextEntryBlockNumber || nextEntryBlockNumber <= lastSnapshot.blockNumber) {
                this._logger.info('Unable to find next block! Stop.');
                break;
            }
            
            console.log('Creating snapshot');
            console.log(
                lastSnapshot.id + 1,
                nextEntryBlockNumber,
                nextEntryDate
            );
            
            lastSnapshot = new Snapshot({
                blockNumber: nextEntryBlockNumber,
                blockHash: (await this._phalaApi.rpc.chain.getBlockHash(nextEntryBlockNumber)).toString(),
                date: nextEntryDate,
            }, this._entityManager);
            
            await this._entityManager.persistAndFlush(lastSnapshot);
        }
    }
    
    
    protected async _findFirstBlockOfEntry (
        targetDate : Date,
        previousEntryBlock : number
    ) : Promise<number>
    {
        let blockInterval : number = HistoryCrawler.BLOCK_INTERVAL;
        let targetBlockToCheck = previousEntryBlock;
        
        process.stdout.write('Finding block: .');
        
        while (true) {
            targetBlockToCheck += blockInterval;
            
            let blockHash : string = null;
            try {
                blockHash = (await this._phalaApi.rpc.chain.getBlockHash(targetBlockToCheck)).toString();
            }
            catch (e) {}
            
            if (!blockHash || Number(blockHash) == 0) {
                // too far ahead
                targetBlockToCheck -= blockInterval;
                blockInterval = Math.round(blockInterval / 2);
                continue;
            }
            
            const blockDateUts : number = <any>(await this._phalaApi.query.timestamp.now.at(blockHash)).toJSON();
            const blockDate : Date = new Date(blockDateUts);
            
            process.stdout.write('.');
            
            const found = blockInterval > 0
                ? blockDate >= targetDate
                : blockDate < targetDate;
            
            if (found) {
                if (blockInterval == -1) {
                    targetBlockToCheck += 1;
                    break;
                }
                
                // halv interval and switch direction
                blockInterval = Math.round(blockInterval / 2);
                blockInterval *= -1;
            }
        }
        
        console.log();
        
        return targetBlockToCheck;
    }
    
    protected async _processHistory (maxEntries : number) : Promise<void>
    {
        this._logger.log('Processing history entries');
        
        const lastSnapshot : Snapshot = await this._entityManager.getRepository(Snapshot)
            .findOne(
                { id: { $gt: 0 } },
                {
                    orderBy: { id: ORM.QueryOrder.DESC }
                }
            );
        
        for (let i = 0; i < maxEntries; ++i) {
            const snapshotId = this._appState.value.lastProcessedNonce + 1;
            
            this._snapshot = await this._entityManager.getRepository(Snapshot)
                .findOne(snapshotId);
            if (!this._snapshot) {
                break;
            }
            
            this._isFinalized = !moment.utc(this._snapshot.date).isAfter(moment.utc());
            
            await this._processHistoryEntry();
            
            if (this._isFinalized) {
                ++this._appState.value.lastProcessedNonce;
            }
            
            await this._entityManager.flush();
        }
    }
    
    protected async _processHistoryEntry () : Promise<boolean>
    {
        this._apiAt = <any>await this._phalaApi.at(this._snapshot.blockHash);
        
        this._tokenomicParameters = <any>(
            await this._apiAt.query
                .phalaMining.tokenomicParameters()
        ).toJSON();
        
        // log
        this._logger.info(
            'Next entry',
            this._snapshot.id,
            this._isFinalized ? 'finalized' : 'intermediate'
        );
        
        await this._clearContext();
        
        // update all stake pools
        this._logger.info('Processing history entry');
        
        await this._processNextHistoryEntry();
        await this._calculateApr();
        
        await this._entityManager.flush();
        
        // processing avg APR
        this._logger.info('Processing avg APR');
        
        await this._calculateAvgApr();
        await this._processAvgStakePools();
        
        await this._entityManager.flush();
        
        // process network state
        this._logger.info('Processing network state');
        
        await this._processNetworkState();
        await this._entityManager.flush();
        
        this._logger.info('Entry done');
        
        return true;
    }
    
    protected async _clearContext ()
    {
        const stakePoolEntryRepository = this._entityManager.getRepository(StakePoolEntry);
        
        // load from cache
        this._specialStakePools[StakePoolEntry.SPECIAL_NETWORK_AVG_ID] = await stakePoolEntryRepository.findOne(StakePoolEntry.SPECIAL_NETWORK_AVG_ID);
        this._specialStakePools[StakePoolEntry.SPECIAL_TOP_AVG_ID] = await stakePoolEntryRepository.findOne(StakePoolEntry.SPECIAL_TOP_AVG_ID);
        
        // stake pools
        const stakePoolEntries = await stakePoolEntryRepository.findAll();
        this._stakePoolEntries = Object.fromEntries(
            stakePoolEntries
                .filter(stakePoolEntry => !!stakePoolEntry.stakePool)
                .map(stakePoolEntry => [ stakePoolEntry.stakePool.onChainId, stakePoolEntry ])
        );
        
        // prepare initial data
        this._processedStakePools = [];
        
        for (const stakePoolEntry of stakePoolEntries) {
            stakePoolEntry.snapshotWorkers = [];
        }
        
        this._workers = [];
    }
    
    
    protected async _processNextHistoryEntry () : Promise<void>
    {
        this._stakePoolsCount = <any>(
            await this._apiAt.query.phalaStakePool.poolCount()
        ).toJSON();
        console.log(
            'Stake pools num:',
            this._stakePoolsCount
        );
        
        // fetch pools
        const stakePoolsRange = range(0, this._stakePoolsCount);
        const onChainStakePools : typeof KhalaTypes.PoolInfo[] = <any>(
            await this._apiAt.query
                .phalaStakePool.stakePools
                .multi(stakePoolsRange)
        ).map(raw => raw.toJSON());
        
        if (onChainStakePools.length != this._stakePoolsCount) {
            throw new RuntimeException(
                'Stake pool data missing',
                1662037104743
            );
        }
        
        const startTime = Date.now();
        let blockTime = Date.now();
        
        for (let stakePoolId = 0; stakePoolId < this._stakePoolsCount; ++stakePoolId) {
            const onChainStakePool = onChainStakePools[stakePoolId];
            if (!onChainStakePool) {
                throw new RuntimeException(
                    'Stake pool data not found',
                    1662037042034
                );
            }
            
            if (Number(onChainStakePool.pid) != stakePoolId) {
                throw new RuntimeException(
                    'Data integrity error / Pool ID mismatch',
                    1662036661646
                );
            }
            
            let done : boolean = false;
            
            for (let t=0; t<3; ++t) {
                try {
                    await this._processStakePool(
                        stakePoolId,
                        onChainStakePool
                    );
                    
                    done = true;
                    break;
                }
                catch (e) {
                    this._logger.log('Request failed. Retrying in 1s');
                    await sleep(1000);
                }
            }
            
            if (!done) {
                throw new RuntimeException(
                    'Unable to process stake pools',
                    1666280122614
                );
            }
            
            if (stakePoolId % 50 == 0) {
                const fraction = stakePoolId / this._stakePoolsCount;
                
                console.log();
                
                if (stakePoolId) {
                    const totalTime = (Date.now() - startTime) / 1000;
                    const deltaTime = (Date.now() - blockTime) / 1000;
                    const eta = totalTime * (1 / fraction - 1);
                    
                    console.log(
                        'Time:   ',
                        moment.duration(totalTime, 'seconds').format('mm:ss', { trim: false }),
                        '(' + moment.duration(deltaTime, 'seconds').format('mm:ss', { trim: false }) + ')'
                    );
                    console.log(
                        'ETA: ',
                        moment.duration(eta, 'seconds').format('hh:mm:ss', { trim: false }),
                    );
                }
                
                process.stdout.write(
                    colors.yellow(
                        'Progress: '
                        + (fraction * 100).toFixed(2).padStart(6, ' ')
                        + '%   '
                    )
                );
                
                blockTime = Date.now();
            }
            
            process.stdout.write('.');
        }
        
        console.log();
        console.log(
            colors.green('Progress: 100.00%')
        );
    }
    
    protected async _processStakePool (
        onChainId : number,
        onChainStakePool : typeof KhalaTypes.PoolInfo
    ) : Promise<void>
    {
        const stakePoolEntry : StakePoolEntry = await this._getOrCreateStakePool(onChainId);
        
        // fetch simple data
        const historyEntry : HistoryEntry = await this._getOrCreateHistoryEntry(
            stakePoolEntry,
            this._snapshot
        );
        
        historyEntry.assign({
            finalized: this._isFinalized,
            
            commission: Polkadot.Utility.parseRawPercent(onChainStakePool.payoutCommission || 0),
            cap: Phala.Utility.parseRawAmount(onChainStakePool.cap),
            stakeTotal: Phala.Utility.parseRawAmount(onChainStakePool.totalStake),
            stakeFree: Phala.Utility.parseRawAmount(onChainStakePool.freeStake),
            stakeReleasing: Phala.Utility.parseRawAmount(onChainStakePool.releasingStake),
        });
        
        const withdrawals = onChainStakePool.withdrawQueue
            .reduce((acc, prev) => acc + Number(prev.shares), 0);
        
        historyEntry.withdrawals = Phala.Utility.parseRawAmount(withdrawals);
        historyEntry.stakeRemaining = historyEntry.cap
            ? (historyEntry.cap - historyEntry.stakeTotal + historyEntry.withdrawals)
            : 1e12;
        
        // process workers
        const workersNum = onChainStakePool.workers.length;
        
        stakePoolEntry.snapshotWorkers = [];
        historyEntry.workersNum = workersNum;
        
        // fetch data
        const bindingAccounts : string[] = (
            await this._apiAt.query
                .phalaMining.workerBindings
                .multi(onChainStakePool.workers)
        ).map(raw => raw.toString());
        
        const onChainMiners : typeof KhalaTypes.MinerInfo[] = <any>(
            await this._apiAt.query
                .phalaMining.miners
                .multi(bindingAccounts)
        ).map(raw => raw.toJSON());
        
        const onChainWorkers : typeof KhalaTypes.WorkerInfo[] = <any>(
            await this._apiAt.query
                .phalaRegistry.workers
                .multi(onChainStakePool.workers)
        ).map(raw => raw.toJSON());
        
        if (
            bindingAccounts.length != workersNum
            || onChainMiners.length != workersNum
            || onChainWorkers.length != workersNum
        ) {
            throw new RuntimeException(
                'Worker data missing',
                1662037457673
            );
        }
        
        for (let idx = 0; idx < onChainStakePool.workers.length; ++idx) {
            const publicKey = onChainStakePool.workers[idx];
            const bindingAccount = bindingAccounts[idx];
            const onChainMiner = onChainMiners[idx];
            const onChainWorker = onChainWorkers[idx];
            
            if (
                publicKey != onChainWorker.pubkey
            ) {
                throw new RuntimeException(
                    'Data integrity error / Public key mismatch',
                    1662036887985
                );
            }
            
            const worker = new Worker({ publicKey });
            
            this._workers.push(worker);
            stakePoolEntry.snapshotWorkers.push(worker);
            
            const workerState : WorkerState = <any>onChainMiner.state;
            if (Worker.MINING_STATES.includes(workerState)) {
                ++historyEntry.workersActiveNum;
            }
            
            // update worker info
            worker.state = workerState;
            
            worker.ve = Phala.Utility.decodeBigNumber(onChainMiner.ve);
            worker.v = Phala.Utility.decodeBigNumber(onChainMiner.v);
            worker.pInit = onChainMiner.benchmark.pInit;
            worker.pInstant = onChainMiner.benchmark.pInstant;
            worker.initialScore = onChainWorker.initialScore;
            worker.confidenceLevel = onChainWorker.confidenceLevel;
        }
        
        // update last history entry
        stakePoolEntry.lastHistoryEntry = historyEntry;
        
        this._entityManager.persist(historyEntry);
        
        this._processedStakePools.push(stakePoolEntry);
    }
    
    protected async _getOrCreateHistoryEntry(
        stakePoolEntry : StakePoolEntry,
        snapshot : Snapshot
    ) : Promise<HistoryEntry>
    {
        const historyEntryRepository = this._entityManager.getRepository(HistoryEntry);
    
        let historyEntry : HistoryEntry = await historyEntryRepository.findOne({
            stakePoolEntry,
            snapshot,
            finalized: false,
        });
        if (!historyEntry) {
            historyEntry = new HistoryEntry({
                stakePoolEntry,
                snapshot
            }, this._entityManager);
            
            historyEntryRepository.persist(historyEntry);
        }
        
        return historyEntry;
    }
    
    
    /**
     * Processing APR
     */
    protected async _calculateApr ()
    {
        if (this._snapshot.id == 1) {
            // skip first entry
            return;
        }
        
        const previousSnapshot = await this._entityManager.getRepository(Snapshot)
            .findOne(this._snapshot.id - 1);
        
        const budgetPerBlock = Phala.Utility.decodeBigNumber(this._tokenomicParameters.budgetPerBlock);
        const treasuryRatio = Phala.Utility.decodeBigNumber(this._tokenomicParameters.treasuryRatio);
        
        const miningEra = await this._calculateMiningEra(this._snapshot.blockNumber);
        const rewardsFractionInEra = Math.pow(HistoryCrawler.HALVING_FRACTION, miningEra);
        
        const deltaTime : number = moment.utc(this._snapshot.date).diff(previousSnapshot.date, 'seconds');
        const deltaBlocks : number = this._snapshot.blockNumber - previousSnapshot.blockNumber;
        const avgBlockTime = deltaTime / deltaBlocks;
        
        const totalShare = Object.values(this._workers)
            .filter(worker => worker.isMiningState)
            .reduce((acc, worker) => acc + worker.getShare(), 0);
        
        for (const stakePoolEntry of this._processedStakePools) {
            if (!stakePoolEntry.lastHistoryEntry.stakeTotal) {
                continue;
            }
            
            const historyEntry = stakePoolEntry.lastHistoryEntry;
            
            const rewardPerBlock = stakePoolEntry.snapshotWorkers
                .filter(worker => worker.isMiningState)
                .reduce((acc, worker) => {
                    let workerRewards = (worker.getShare() / totalShare) * budgetPerBlock;
                    
                    const maxRewards = this._getMaxRewards(worker.v);
                    if (maxRewards !== null) {
                        workerRewards = Math.min(workerRewards, maxRewards);
                    }
                    
                    return acc + workerRewards;
                }, 0);
            
            const currentApr = rewardPerBlock
                * rewardsFractionInEra
                * (1 - treasuryRatio)
                * (1 - stakePoolEntry.lastHistoryEntry.commission)
                * (31536000 / avgBlockTime)
                / stakePoolEntry.lastHistoryEntry.stakeTotal;
            
            historyEntry.currentApr = (
                historyEntry.currentApr * historyEntry.intermediateStep
                + currentApr
            ) / (historyEntry.intermediateStep + 1);
            ++historyEntry.intermediateStep;
        }
    }
    
    protected async _calculateAvgApr ()
    {
        const historyEntryRepository = this._entityManager.getRepository(HistoryEntry);
        const entriesNum = Math.ceil(30 / HistoryCrawler.HISTORY_ENTRY_INTERVAL);
        const snapshotThreshold = Math.max(
            1,
            this._snapshot.id - entriesNum
        );
        
        for (const stakePoolEntry of this._processedStakePools) {
            stakePoolEntry.lastHistoryEntry.avgApr = await historyEntryRepository.getAvgApr(
                stakePoolEntry.id,
                snapshotThreshold
            );
        }
    }
    
    protected async _calculateMiningEra (
        blockNumber : number
    ) : Promise<number>
    {
        let miningStartBlock : number = null;
        
        try {
            miningStartBlock = <any>(
                await this._apiAt.query
                    .phalaMining.miningStartBlock()
            ).toJSON();
        }
        catch (e) {
            return 0;
        }
        
        const miningHalvingInterval : number = <any>(
            await this._apiAt.query
                .phalaMining.miningHalvingInterval()
        ).toJSON();
        
        return Math.floor((blockNumber - miningStartBlock) / miningHalvingInterval);
    }
    
    protected _getMaxRewards (workerV : number) : number
    {
        if (
            this._network === Network.Khala
            && this._snapshot.blockNumber < HistoryCrawler.GEMINI_UPGRADE_BLOCKHEIGHT
        ) {
            return (workerV * 0.0002) / (3600 / 12);
        }
        
        // no rewards limit
        return null;
    }
    
    
    /**
     * Processing avg entries
     */
    protected async _processAvgStakePools () : Promise<void>
    {
        // sort stake pools
        this._sortedStakePools = this._processedStakePools
            .slice(0, this._stakePoolsCount)
            .filter(sp => sp.lastHistoryEntry.currentApr > 0)
            .sort((a, b) => a.lastHistoryEntry.currentApr > b.lastHistoryEntry.currentApr ? -1 : 1);
        
        // process avg entries
        await this._processAvgStakePool(
            this._specialStakePools[StakePoolEntry.SPECIAL_NETWORK_AVG_ID],
            this._sortedStakePools
        );
        
        await this._processAvgStakePool(
            this._specialStakePools[StakePoolEntry.SPECIAL_TOP_AVG_ID],
            this._sortedStakePools.slice(0, 100)
        );
    }
    
    protected async _processAvgStakePool (
        stakePoolEntry : StakePoolEntry,
        limitedStakePools : StakePoolEntry[]
    ) : Promise<void>
    {
        const oneOfHistoryEntries : HistoryEntry = this._processedStakePools[0].lastHistoryEntry;
        
        const historyEntry : HistoryEntry = new HistoryEntry({
            stakePoolEntry,
            snapshot: this._snapshot,
        }, this._entityManager);
        this._entityManager.persist(historyEntry);
        
        stakePoolEntry.assign({
            lastHistoryEntry: historyEntry,
        });
        
        const fieldsToCalculate = [
            'commission',
            'workersNum',
            'workersActiveNum',
            'cap',
            'stakeTotal',
            'stakeFree',
            'stakeReleasing',
            'stakeRemaining',
            'withdrawals',
            'currentApr',
            'avgApr',
        ];
        
        const sumOfTotalStake : number = limitedStakePools
            .reduce((acc, sp) => acc + sp.lastHistoryEntry.stakeTotal, 0);
        
        for (const field of fieldsToCalculate) {
            let sumValue = limitedStakePools
                .map(sp => sp.lastHistoryEntry)
                .filter(h => h[field] !== null)
                .reduce((acc, h) => acc + (h.stakeTotal * h[field]), 0);
            
            historyEntry[field] = sumValue / sumOfTotalStake;
            
            if (isNaN(historyEntry[field])) {
                historyEntry[field] = 0;
            }
        }
    }
    
    
    protected async _processNetworkState ()
    {
        const networkStateRepository = this._entityManager.getRepository(NetworkState);
        
        let networkState = await networkStateRepository.findOne({ snapshot: this._snapshot });
        if (!networkState) {
            networkState = new NetworkState({
                snapshot: this._snapshot
            }, this._entityManager);
        }
        
        networkState.totalShares = Object.values(this._workers)
            .filter(worker => worker.isMiningState)
            .reduce((acc, worker) => acc + worker.getShare(), 0);
        
        this._entityManager.persist(networkState);
    }
    
}

import { Network } from '#/App/Domain/Type/Network';
import { AppState } from '#/BackendCore/Domain/Model/AppState';
import * as Phala from '#/Phala';
import { Account } from '#/Phala/Domain/Model';
import * as Polkadot from '#/Polkadot';
import { HistoryCrawlerState } from '#/Stats/Domain/Model/AppState/HistoryCrawlerState';
import { HistoryEntry } from '#/Stats/Domain/Model/HistoryEntry';
import { NetworkState } from '#/Stats/Domain/Model/NetworkState';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import { Worker, WorkerState } from '#/Stats/Domain/Model/Worker';
import { AbstractCrawler } from '#/Stats/Service/AbstractCrawler';
import { Config } from '@inti5/configuration';
import moment from 'moment';


export class HistoryCrawler
    extends AbstractCrawler
{

    public static readonly HISTORY_ENTRY_INTERVAL = 0.25;
    
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
    
    
    protected _appStateClass : any = HistoryCrawlerState;
    protected _appState : AppState<HistoryCrawlerState>;
    
    protected _tokenomicParameters : typeof Phala.KhalaTypes.TokenomicParameters;
    
    protected _previousEntryBlockNumber : number;
    
    protected _nextEntryDate : Date;
    protected _nextEntryBlockNumber : number;
    protected _nextEntryBlockHash : string;
    
    protected _stakePoolsCount : number = 0;
    protected _processedStakePools : StakePoolEntry[] = [];
    protected _sortedStakePools : StakePoolEntry[] = [];
    protected _specialStakePools : { [id : number] : StakePoolEntry } = {};
    
    
    protected async _process ()
    {
        this._logger.log('Processing history entries');
        
        // max 3 entries per execution
        for (let i = 0; i < 1000; ++i) {
            try {
                const continueRunning = await this._processOnce();
                if (!continueRunning) {
                    break;
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    
    protected async _processOnce () : Promise<boolean>
    {
        const nextEntryMoment = moment(this._appState.value.lastProcessedUts * 1000)
            .minute(0)
            .second(0)
            .millisecond(0)
            .add(6, 'hour');
        
        const finalizedThresholdMoment = moment();
        const hardThresholdMoment = moment().add(6, 'hours');
        
        const finalized = !nextEntryMoment.isAfter(finalizedThresholdMoment);
        
        if (nextEntryMoment.isAfter(hardThresholdMoment)) {
            this._logger.info('Not processed yet! Stop.');
            return false;
        }
        
        // find first block of next entry
        this._previousEntryBlockNumber = this._appState.value.lastProcessedBlock;
        
        if (finalized) {
            this._nextEntryDate = nextEntryMoment.toDate();
            this._nextEntryBlockNumber = await this._findFirstBlockOfEntry(
                this._nextEntryDate,
                this._appState.value.lastProcessedBlock
            );
        }
        else {
            this._nextEntryDate = new Date();
            this._nextEntryBlockNumber = this._finalizedBlockNumber;
        }
        
        if (!this._nextEntryBlockNumber || this._nextEntryBlockNumber <= this._previousEntryBlockNumber) {
            this._logger.info('Unable to find next block! Stop.');
            return false;
        }
        
        this._nextEntryBlockHash = (await this._phalaApi.rpc.chain.getBlockHash(this._nextEntryBlockNumber)).toString();
        
        // update block related data
        this._tokenomicParameters =
            <any>(await this._phalaApi.query.phalaMining.tokenomicParameters.at(this._nextEntryBlockHash)).toJSON();
        
        // log
        this._logger.info('Next entry block found');
        this._logger.info('Prev', this._previousEntryBlockNumber);
        this._logger.info(moment(this._appState.value.lastProcessedUts * 1000).toISOString());
        this._logger.info('Next', this._nextEntryBlockNumber);
        this._logger.info(moment(this._nextEntryDate).toISOString());
        
        // update all stake pools
        await this._entityManagerWrapper.transaction(async(entityManager) => {
            this._txEntityManager = entityManager;
            
            await this._clearContext();
            await this._processNextHistoryEntry(finalized);
            
            await this._calculateApr();
            
            await entityManager.flush();
            
            await this._calculateAvgApr();
            await this._processAvgStakePools();
            
            await entityManager.flush();
            
            if (finalized) {
                await this._processNetworkState();
                await entityManager.flush();
            }
        });
        
        if (finalized) {
            // update app state
            this._appState.value.lastProcessedBlock = this._nextEntryBlockNumber;
            this._appState.value.lastProcessedUts = Number(this._nextEntryDate) / 1000;
            ++this._appState.value.lastProcessedNonce;
        }
        
        await this._entityManager.flush();
        
        this._logger.info('Entry done');
        
        return finalized;
    }
    
    protected async _clearContext ()
    {
        const stakePoolEntryRepository = this._txEntityManager.getRepository(StakePoolEntry);
        
        // load from cache
        this._specialStakePools[StakePoolEntry.SPECIAL_NETWORK_AVG_ID] = await stakePoolEntryRepository.findOne(StakePoolEntry.SPECIAL_NETWORK_AVG_ID);
        this._specialStakePools[StakePoolEntry.SPECIAL_TOP_AVG_ID] = await stakePoolEntryRepository.findOne(StakePoolEntry.SPECIAL_TOP_AVG_ID);
        
        // stake pools
        const stakePoolEntries = await stakePoolEntryRepository.findAll({
            populate: [ 'workers' ]
        });
        this._stakePoolEntries = Object.fromEntries(
            stakePoolEntries
                .filter(stakePoolEntry => !!stakePoolEntry.stakePool)
                .map(stakePoolEntry => [ stakePoolEntry.stakePool.onChainId, stakePoolEntry ])
        );
        
        // accounts
        const accountRepository = this._txEntityManager.getRepository(Account);
        const accounts = await accountRepository.findAll();
        this._accounts = Object.fromEntries(accounts.map(account => [ account.address, account ]));
        
        // workers
        const workerRepository = this._txEntityManager.getRepository(Worker);
        const workers = await workerRepository.findAll();
        this._workers = Object.fromEntries(workers.map(worker => [ worker.publicKey, worker ]));
        
        // prepare initial data
        this._processedStakePools = [];
        
        for (const stakePoolEntry of stakePoolEntries) {
            stakePoolEntry.snapshotWorkers = [];
        }
        
        for (const worker of workers) {
            worker.isDropped = true;
        }
    }
    
    /**
     * Find first block of day
     */
    protected async _findFirstBlockOfEntry (targetDate : Date, previousEntryBlock : number) : Promise<number>
    {
        let blockInterval : number = HistoryCrawler.BLOCK_INTERVAL;
        let targetBlockToCheck = previousEntryBlock;
        
        console.log('Finding block...');
        console.log(
            previousEntryBlock,
            targetDate
        );
        
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
            
            console.log(targetBlockToCheck, blockDate);
            
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
        
        return targetBlockToCheck;
    }
    
    /**
     * Process stake pools
     */
    protected async _processNextHistoryEntry (
        finalized : boolean
    ) : Promise<void>
    {
        this._stakePoolsCount = <any>(await this._phalaApi.query.phalaStakePool.poolCount.at(this._nextEntryBlockHash)).toJSON();
        this._logger.log('Stake pools num', this._stakePoolsCount);
        
        for (let stakePoolId = 0; stakePoolId < this._stakePoolsCount; ++stakePoolId) {
            await this._processStakePool(
                stakePoolId,
                finalized
            );
            
            if (stakePoolId % 50 == 0) {
                console.log(
                    'Progress:',
                    (stakePoolId / this._stakePoolsCount * 100).toFixed(2) + '%'
                );
            }
        }
        
        console.log('Progress: 100.00%');
    }
    
    protected async _processStakePool (
        onChainId : number,
        finalized : boolean
    ) : Promise<void>
    {
        const stakePoolEntry : StakePoolEntry = await this._getOrCreateStakePool(onChainId);
        
        const onChainStakePool : typeof Phala.KhalaTypes.PoolInfo =
            <any>(await this._phalaApi.query.phalaStakePool.stakePools.at(this._nextEntryBlockHash, stakePoolEntry.stakePool.onChainId)).toJSON();
        
        // fetch simple data
        const historyEntry : HistoryEntry = await this._getOrCreateHistoryEntry(
            stakePoolEntry,
            this._appState.value.lastProcessedNonce + 1
        );
        
        historyEntry.assign({
            entryDate: this._nextEntryDate,
            finalized,
            
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
        stakePoolEntry.snapshotWorkers = [];
        historyEntry.workersNum = onChainStakePool.workers.length;
        
        let rewardsPerBlock = 0;
        
        for (const workerPublicKey of onChainStakePool.workers) {
            const worker = await this._getOrCreateWorker(workerPublicKey, stakePoolEntry);
            worker.isDropped = false;
            
            stakePoolEntry.snapshotWorkers.push(worker);
            
            worker.bindingAccount = (await this._phalaApi.query.phalaMining.workerBindings.at(this._nextEntryBlockHash, workerPublicKey)).toString();
            
            const onChainMiner : typeof Phala.KhalaTypes.MinerInfo =
                <any>(await this._phalaApi.query.phalaMining.miners.at(this._nextEntryBlockHash, worker.bindingAccount)).toJSON();
            if (!onChainMiner) {
                continue;
            }
            
            const workerOnChain : typeof Phala.KhalaTypes.WorkerInfo =
                <any>(await this._phalaApi.query.phalaRegistry.workers(workerPublicKey)).toJSON();
            
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
            worker.confidenceLevel = workerOnChain.confidenceLevel;
            
            worker.totalRewards = Phala.Utility.parseRawAmount(onChainMiner.stats.totalReward);
            
            if (!stakePoolEntry.workers.contains(worker)) {
                stakePoolEntry.workers.add(worker);
            }
        }
        
        // update last history entry
        stakePoolEntry.lastHistoryEntry = historyEntry;
        
        this._txEntityManager.persist(historyEntry);
        
        this._processedStakePools.push(stakePoolEntry);
    }
    
    protected async _getOrCreateHistoryEntry(
        stakePoolEntry : StakePoolEntry,
        entryNonce : number
    ) : Promise<HistoryEntry>
    {
        const historyEntryRepository = this._entityManager.getRepository(HistoryEntry);
    
        let historyEntry : HistoryEntry = await historyEntryRepository.findOne({
            stakePoolEntry,
            entryNonce,
            finalized: false,
        });
        if (!historyEntry) {
            historyEntry = new HistoryEntry({
                stakePoolEntry,
                entryNonce
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
        const budgetPerBlock = Phala.Utility.decodeBigNumber(this._tokenomicParameters.budgetPerBlock);
        const treasuryRatio = Phala.Utility.decodeBigNumber(this._tokenomicParameters.treasuryRatio);
        
        const miningEra = await this._calculateMiningEra(this._nextEntryBlockNumber);
        const rewardsFractionInEra = Math.pow(HistoryCrawler.HALVING_FRACTION, miningEra);
        
        const nextEntryUts : number = Number(this._nextEntryDate) / 1000;
        const avgBlockTime = (nextEntryUts - this._appState.value.lastProcessedUts) / (this._nextEntryBlockNumber - this._previousEntryBlockNumber);
        
        const totalShare = Object.values(this._workers)
            .filter(worker => !worker.isDropped && worker.isMiningState)
            .reduce((acc, worker) => acc + worker.getShare(), 0);
        
        for (const stakePoolEntry of this._processedStakePools) {
            if (!stakePoolEntry.lastHistoryEntry.stakeTotal) {
                continue;
            }
            
            const rewardPerBlock = stakePoolEntry.snapshotWorkers
                .filter(worker => !worker.isDropped && worker.isMiningState)
                .reduce((acc, worker) => {
                    let workerRewards = (worker.getShare() / totalShare) * budgetPerBlock;
                    
                    const maxRewards = this._getMaxRewards(worker.v);
                    if (maxRewards !== null) {
                        workerRewards = Math.min(workerRewards, maxRewards);
                    }
                    
                    return acc + workerRewards;
                }, 0);
            
            stakePoolEntry.lastHistoryEntry.currentApr = rewardPerBlock
                * rewardsFractionInEra
                * (1 - treasuryRatio)
                * (1 - stakePoolEntry.lastHistoryEntry.commission)
                * (31536000 / avgBlockTime)
                / stakePoolEntry.lastHistoryEntry.stakeTotal;
        }
    }
    
    protected async _calculateMiningEra (
        blockNumber : number
    ) : Promise<number>
    {
        let miningStartBlock : number = null;
        
        try {
            miningStartBlock = <any>(await this._phalaApi.query.phalaMining.miningStartBlock.at(this._nextEntryBlockHash)).toJSON();
        }
        catch (e) {
            return 0;
        }
        
        const miningHalvingInterval : number = <any>(await this._phalaApi.query.phalaMining.miningHalvingInterval.at(this._nextEntryBlockHash)).toJSON();
        
        return Math.floor((blockNumber - miningStartBlock) / miningHalvingInterval);
    }
    
    protected _getMaxRewards (workerV : number) : number
    {
        if (
            this._network === Network.Khala
            && this._nextEntryBlockNumber < HistoryCrawler.GEMINI_UPGRADE_BLOCKHEIGHT
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
        stakePool : StakePoolEntry,
        limitedStakePools : StakePoolEntry[]
    ) : Promise<void>
    {
        const oneOfHistoryEntries : HistoryEntry = this._processedStakePools[0].lastHistoryEntry;
        const historyEntry : HistoryEntry = new HistoryEntry({
            stakePoolEntry: stakePool,
            entryNonce: oneOfHistoryEntries.entryNonce,
            entryDate: oneOfHistoryEntries.entryDate,
        }, this._entityManager);
        
        stakePool.lastHistoryEntry = historyEntry;
        
        this._txEntityManager.persist(historyEntry);
        
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
    
    protected async _calculateAvgApr ()
    {
        const entriesNum = Math.ceil(30 / HistoryCrawler.HISTORY_ENTRY_INTERVAL);
        
        for (const stakePool of this._processedStakePools) {
            // offset last entry (not updated yet)
            const chunk = await stakePool.historyEntries.matching({
                orderBy: { entryNonce: 'DESC' },
                limit: entriesNum,
            });
            
            stakePool.lastHistoryEntry.avgApr = chunk.map(entry => entry.currentApr)
                .reduce((acc, curr) => acc + curr, 0) / chunk.length;
        }
    }
    
    
    protected async _processNetworkState ()
    {
        const networkState = new NetworkState({
            entryNonce: this._appState.value.lastProcessedNonce + 1,
            entryDate: this._nextEntryDate,
        }, this._txEntityManager);
        
        networkState.totalShares = Object.values(this._workers)
            .filter(worker => !worker.isDropped && worker.isMiningState)
            .reduce((acc, worker) => acc + worker.getShare(), 0);
        
        this._txEntityManager.persist(networkState);
    }
    
}

import { AppState } from '#/BackendCore/Domain/Model/AppState';
import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import * as Phala from '#/Phala';
import { Account } from '#/Phala/Domain/Model';
import * as Polkadot from '#/Polkadot';
import { StakePoolHistoryCrawlerState } from '#/Stats/Domain/Model/AppState/StakePoolHistoryCrawlerState';
import { HistoryEntry } from '#/Stats/Domain/Model/HistoryEntry';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import { Worker, WorkerState } from '#/Stats/Domain/Model/Worker';
import { AbstractCrawler } from '#/Stats/Service/AbstractCrawler';
import { Injectable } from '@inti5/object-manager';
import { Timeout } from '@inti5/utils/Timeout';
import moment from 'moment';


type ObjectMap<V> = {
    [index : string] : V
};


@Injectable({ tag: 'tasker.handler' })
export class StakePoolHistoryCrawler
    extends AbstractCrawler
{
    
    protected static readonly HALVING_FRACTION = 0.75;
    protected static readonly HISTORY_ENTRY_INTERVAL = 0.25;
    protected static readonly BLOCK_INTERVAL = 2048;
    protected static readonly CONFIDENCE_SCORE_MAP = { 1: 1, 2: 1, 3: 1, 4: 0.8, 5: 0.7 };
    
    
    protected _appStateClass : any = StakePoolHistoryCrawlerState;
    protected _appState : AppState<StakePoolHistoryCrawlerState>;
    
    protected _tokenomicParameters : typeof Phala.KhalaTypes.TokenomicParameters;
    
    protected _previousEntryBlockNumber : number;
    
    protected _nextEntryDate : Date;
    protected _nextEntryBlockNumber : number;
    protected _nextEntryBlockHash : string;
    
    protected _avgBlockTime : number;
    
    protected _miningEra : number;
    
    protected _stakePoolsCount : number = 0;
    protected _processedStakePools : StakePoolEntry[] = [];
    protected _sortedStakePools : StakePoolEntry[] = [];
    protected _specialStakePools : { [id : number] : StakePoolEntry } = {};
    
    
    @Task({
        cronExpr: '*/15 * * * *'
    })
    @Timeout(30 * 60 * 1000)
    public async run ()
    {
        return super.run();
    }
    
    protected async _process ()
    {
        this._logger.log('Processing history entries');
        
        // max 10 entries per execution
        for (let i = 0; i < 10; ++i) {
            const nextEntryMoment = moment(this._appState.value.lastProcessedUts * 1000)
                .minute(0)
                .second(0)
                .millisecond(0)
                .add(6, 'hour');
            
            if (nextEntryMoment.isAfter(moment().subtract(1, 'hour'))) {
                this._logger.info('Not processed yet! Stop.');
                break;
            }
            
            // find first block of next entry
            this._previousEntryBlockNumber = this._appState.value.lastProcessedBlock;
            
            this._nextEntryDate = nextEntryMoment.toDate();
            this._nextEntryBlockNumber = await this._findFirstBlockOfEntry(this._nextEntryDate, this._appState.value.lastProcessedBlock);
            if (!this._nextEntryBlockNumber || this._nextEntryBlockNumber <= this._previousEntryBlockNumber) {
                this._logger.info('Unable to find next block! Stop.');
                break;
            }
            
            this._nextEntryBlockHash = (await this._phalaApi.rpc.chain.getBlockHash(this._nextEntryBlockNumber)).toString();
            
            const nextEntryUts : number = Number(this._nextEntryDate) / 1000;
            this._avgBlockTime = (nextEntryUts - this._appState.value.lastProcessedUts) / (this._nextEntryBlockNumber - this._previousEntryBlockNumber);
            
            // update block related data
            this._tokenomicParameters =
                <any>(await this._phalaApi.query.phalaMining.tokenomicParameters.at(this._nextEntryBlockHash)).toJSON();
            
            this._miningEra = await this._calculateMiningEra(this._nextEntryBlockNumber);
            
            // log
            this._logger.info('Next entry block found');
            this._logger.info('Prev', this._previousEntryBlockNumber);
            this._logger.info(moment(this._appState.value.lastProcessedUts * 1000).toISOString());
            this._logger.info('Next', this._nextEntryBlockNumber);
            this._logger.info(moment(nextEntryUts * 1000).toISOString());
            
            try {
                // update all stake pools
                await this._entityManagerWrapper.transaction(async(entityManager) => {
                    this._txEntityManager = entityManager;
                    
                    await this._clearContext();
                    await this._processNextHistoryEntry();
                    
                    await this._calculateApr();
                    
                    await entityManager.flush();
                    
                    await this._calculateAvgApr();
                    await this._processAvgStakePools();
                    
                    await entityManager.flush();
                });
                
                // update app state
                this._appState.value.lastProcessedBlock = this._nextEntryBlockNumber;
                this._appState.value.lastProcessedUts = nextEntryUts;
                ++this._appState.value.lastProcessedNonce;
                
                await this._entityManager.flush();
            }
            catch (e) {
                console.error(e);
            }
        }
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
        let blockInterval : number = StakePoolHistoryCrawler.BLOCK_INTERVAL;
        let targetBlockToCheck = previousEntryBlock;
        
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
    
    protected async _calculateMiningEra (
        blockNumber : number
    ) : Promise<number>
    {
        const miningStartBlock : number = <any>(await this._phalaApi.query.phalaMining.miningStartBlock()).toJSON();
        const miningHalvingInterval : number = <any>(await this._phalaApi.query.phalaMining.miningHalvingInterval()).toJSON();
        
        return Math.floor((blockNumber - miningStartBlock) / miningHalvingInterval);
    }
    
    /**
     * Process stake pools
     */
    protected async _processNextHistoryEntry () : Promise<void>
    {
        this._stakePoolsCount = <any>(await this._phalaApi.query.phalaStakePool.poolCount.at(this._nextEntryBlockHash)).toJSON();
        this._logger.log('Stake pools num', this._stakePoolsCount);
        
        for (let stakePoolId = 0; stakePoolId < this._stakePoolsCount; ++stakePoolId) {
            await this._processStakePool(stakePoolId);
            console.log(stakePoolId);
        }
    }
    
    protected async _processStakePool (onChainId : number) : Promise<void>
    {
        const stakePoolEntry : StakePoolEntry = await this._getOrCreateStakePool(onChainId);
        
        const onChainStakePool : typeof Phala.KhalaTypes.PoolInfo =
            <any>(await this._phalaApi.query.phalaStakePool.stakePools.at(this._nextEntryBlockHash, stakePoolEntry.stakePool.onChainId)).toJSON();
        
        // fetch simple data
        const historyEntry : HistoryEntry = new HistoryEntry({
            stakePoolEntry: stakePoolEntry,
            entryNonce: this._appState.value.lastProcessedNonce + 1,
            entryDate: this._nextEntryDate,
            
            commission: Polkadot.Utility.parseRawPercent(onChainStakePool.payoutCommission || 0),
            cap: Phala.Utility.parseRawAmount(onChainStakePool.cap),
            stakeTotal: Phala.Utility.parseRawAmount(onChainStakePool.totalStake),
            stakeFree: Phala.Utility.parseRawAmount(onChainStakePool.freeStake),
            stakeReleasing: Phala.Utility.parseRawAmount(onChainStakePool.releasingStake),
        }, this._entityManager);
        
        const withdrawals = onChainStakePool.withdrawQueue
            .reduce((acc, prev) => acc + Number(prev.shares), 0);
        
        historyEntry.withdrawals = Phala.Utility.parseRawAmount(withdrawals);
        historyEntry.stakeRemaining = historyEntry.cap
            ? (historyEntry.cap - historyEntry.stakeTotal + historyEntry.withdrawals)
            : 0;
        
        // process workers
        stakePoolEntry.snapshotWorkers = [];
        historyEntry.workersNum = onChainStakePool.workers.length;
        
        let rewardsPerBlock = 0;
        
        for (const workerPublicKey of onChainStakePool.workers) {
            const worker = await this._getOrCreateWorker(workerPublicKey, stakePoolEntry);
            worker.isDropped = false;
            
            stakePoolEntry.snapshotWorkers.push(worker);
            
            if (!worker.bindingAccount) {
                worker.bindingAccount = (await this._phalaApi.query.phalaMining.workerBindings.at(this._nextEntryBlockHash, workerPublicKey)).toString();
            }
            
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
            
            historyEntry.pTotal += onChainMiner.benchmark.pInstant;
            historyEntry.vTotal += Phala.Utility.parseRawAmount(onChainMiner.v);
            
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
        
        const rewardsAcc = Phala.Utility.decodeBigNumber(onChainStakePool.rewardAcc);
        historyEntry.rewardsTotal = historyEntry.stakeTotal * rewardsAcc;
        
        // update last history entry
        stakePoolEntry.lastHistoryEntry = historyEntry;
        
        this._txEntityManager.persist(historyEntry);
        
        this._processedStakePools.push(stakePoolEntry);
    }
    
    protected async _calculateApr ()
    {
        const budgetPerBlock = Phala.Utility.decodeBigNumber(this._tokenomicParameters.budgetPerBlock);
        const treasuryRatio = Phala.Utility.decodeBigNumber(this._tokenomicParameters.treasuryRatio);
        const rewardsFractionInEra = Math.pow(StakePoolHistoryCrawler.HALVING_FRACTION, this._miningEra);
        
        const totalShare = Object.values(this._workers)
            .filter(worker => !worker.isDropped && worker.isMiningState)
            .reduce((acc, worker) => acc + worker.getShare(), 0);
        
        for (const stakePool of this._processedStakePools) {
            if (!stakePool.lastHistoryEntry.stakeTotal) {
                continue;
            }
            
            const rewardPerBlock = stakePool.snapshotWorkers
                .filter(worker => !worker.isDropped && worker.isMiningState)
                .reduce((acc, worker) => {
                    const workerReward = (worker.getShare() / totalShare) * budgetPerBlock;
                    const maxReward = (worker.v * 0.0002) / (3600 / 12);
                    return acc + Math.min(workerReward, maxReward);
                }, 0);
            
            stakePool.lastHistoryEntry.currentRewardsDaily = rewardPerBlock
                * rewardsFractionInEra
                * (1 - treasuryRatio)
                * (1 - stakePool.lastHistoryEntry.commission)
                * (86400 / this._avgBlockTime);
            
            stakePool.lastHistoryEntry.currentApr = rewardPerBlock
                * rewardsFractionInEra
                * (1 - treasuryRatio)
                * (1 - stakePool.lastHistoryEntry.commission)
                * (31536000 / this._avgBlockTime)
                / stakePool.lastHistoryEntry.stakeTotal;
        }
    }
    
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
            'vTotal',
            'pTotal',
            'rewardsTotal',
            'currentRewardsDaily',
            'currentApr',
            'avgRewardsDaily',
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
        const entriesNum = Math.ceil(30 / StakePoolHistoryCrawler.HISTORY_ENTRY_INTERVAL);
        
        for (const stakePool of this._processedStakePools) {
            // offset last entry (not updated yet)
            const chunk = await stakePool.historyEntries.matching({
                orderBy: { entryNonce: 'DESC' },
                limit: entriesNum,
            });
            
            stakePool.lastHistoryEntry.avgRewardsDaily = chunk.map(entry => entry.currentRewardsDaily)
                .reduce((acc, curr) => acc + curr, 0) / chunk.length;
            
            stakePool.lastHistoryEntry.avgApr = chunk.map(entry => entry.currentApr)
                .reduce((acc, curr) => acc + curr, 0) / chunk.length;
        }
    }
    
}

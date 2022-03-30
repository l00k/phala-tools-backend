import { AppState } from '#/BackendCore/Domain/Model/AppState';
import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import * as Phala from '#/Phala';
import { Account } from '#/Phala/Domain/Model';
import * as Polkadot from '#/Polkadot';
import { StakePoolHistoryCrawlerState } from '#/Stats/Domain/Model/AppState/StakePoolHistoryCrawlerState';
import { StakePool } from '#/Stats/Domain/Model/StakePool';
import { HistoryEntry } from '#/Stats/Domain/Model/StakePool/HistoryEntry';
import { Worker, WorkerState } from '#/Stats/Domain/Model/Worker';
import { AbstractCrawler } from '#/Stats/Service/AbstractCrawler';
import { Injectable } from '@inti5/object-manager';
import { Timeout } from '@inti5/utils/Timeout';
import chunk from 'lodash/chunk';
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
    
    
    protected appStateClass : any = StakePoolHistoryCrawlerState;
    protected appState : AppState<StakePoolHistoryCrawlerState>;
    
    protected tokenomicParameters : typeof Phala.KhalaTypes.TokenomicParameters;
    
    protected previousEntryBlockNumber : number;
    
    protected nextEntryDate : Date;
    protected nextEntryBlockNumber : number;
    protected nextEntryBlockHash : string;
    
    protected avgBlockTime : number;
    
    protected miningEra : number;
    
    protected stakePoolsCount : number = 0;
    protected processedStakePools : StakePool[] = [];
    protected sortedStakePools : StakePool[] = [];
    protected specialStakePools : { [id : number] : StakePool } = {};
    
    
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
            const nextEntryMoment = moment(this.appState.value.lastProcessedUts * 1000)
                .minute(0)
                .second(0)
                .millisecond(0)
                .add(6, 'hour');
            
            if (nextEntryMoment.isAfter(moment().subtract(1, 'hour'))) {
                this._logger.info('Not processed yet! Stop.');
                break;
            }
            
            // find first block of next entry
            this.previousEntryBlockNumber = this.appState.value.lastProcessedBlock;
            
            this.nextEntryDate = nextEntryMoment.toDate();
            this.nextEntryBlockNumber = await this.findFirstBlockOfEntry(this.nextEntryDate, this.appState.value.lastProcessedBlock);
            if (!this.nextEntryBlockNumber || this.nextEntryBlockNumber <= this.previousEntryBlockNumber) {
                this._logger.info('Unable to find next block! Stop.');
                break;
            }
            
            this.nextEntryBlockHash = (await this.phalaApi.rpc.chain.getBlockHash(this.nextEntryBlockNumber)).toString();
            
            const nextEntryUts : number = Number(this.nextEntryDate) / 1000;
            this.avgBlockTime = (nextEntryUts - this.appState.value.lastProcessedUts) / (this.nextEntryBlockNumber - this.previousEntryBlockNumber);
            
            // update block related data
            this.tokenomicParameters =
                <any>(await this.phalaApi.query.phalaMining.tokenomicParameters.at(this.nextEntryBlockHash)).toJSON();
            
            this.miningEra = await this.calculateMiningEra(this.nextEntryBlockNumber);
            
            // log
            this._logger.info('Next entry block found');
            this._logger.info('Prev', this.previousEntryBlockNumber);
            this._logger.info(moment(this.appState.value.lastProcessedUts * 1000).toISOString());
            this._logger.info('Next', this.nextEntryBlockNumber);
            this._logger.info(moment(nextEntryUts * 1000).toISOString());
            
            try {
                // update all stake pools
                await this._entityManagerWrapper.transaction(async(entityManager) => {
                    this._txEntityManager = entityManager;
                    
                    await this.clearContext();
                    await this.processNextHistoryEntry();
                    
                    await this.calculateApr();
                    
                    await entityManager.flush();
                    
                    await this.calculateAvgApr();
                    await this.processAvgStakePools();
                    
                    await entityManager.flush();
                });
                
                // update app state
                this.appState.value.lastProcessedBlock = this.nextEntryBlockNumber;
                this.appState.value.lastProcessedUts = nextEntryUts;
                ++this.appState.value.lastProcessedNonce;
                
                await this._entityManager.flush();
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    
    protected async clearContext ()
    {
        const stakePoolRepository = this._txEntityManager.getRepository(StakePool);
        
        // load from cache
        this.specialStakePools[StakePool.SPECIAL_NETWORK_AVG_ID] = await stakePoolRepository.findOne(StakePool.SPECIAL_NETWORK_AVG_ID);
        this.specialStakePools[StakePool.SPECIAL_TOP_AVG_ID] = await stakePoolRepository.findOne(StakePool.SPECIAL_TOP_AVG_ID);
        
        // stake pools
        const stakePools = await stakePoolRepository.findAll({ populate: [ 'workers' ] });
        this.stakePools = Object.fromEntries(
            stakePools
                .filter(stakePool => !!stakePool.onChainId)
                .map(stakePool => [ stakePool.onChainId, stakePool ])
        );
        
        // accounts
        const accountRepository = this._txEntityManager.getRepository(Account);
        const accounts = await accountRepository.findAll();
        this.accounts = Object.fromEntries(accounts.map(account => [ account.address, account ]));
        
        // workers
        const workerRepository = this._txEntityManager.getRepository(Worker);
        const workers = await workerRepository.findAll();
        this.workers = Object.fromEntries(workers.map(worker => [ worker.publicKey, worker ]));
        
        // prepare initial data
        this.processedStakePools = [];
        
        for (const stakePool of stakePools) {
            stakePool.snapshotWorkers = [];
        }
        
        for (const worker of workers) {
            worker.isDropped = true;
        }
    }
    
    /**
     * Find first block of day
     */
    protected async findFirstBlockOfEntry (targetDate : Date, previousEntryBlock : number) : Promise<number>
    {
        let blockInterval : number = StakePoolHistoryCrawler.BLOCK_INTERVAL;
        let targetBlockToCheck = previousEntryBlock;
        
        while (true) {
            targetBlockToCheck += blockInterval;
            
            let blockHash : string = null;
            try {
                blockHash = (await this.phalaApi.rpc.chain.getBlockHash(targetBlockToCheck)).toString();
            }
            catch (e) {}
            
            if (!blockHash || Number(blockHash) == 0) {
                // too far ahead
                targetBlockToCheck -= blockInterval;
                blockInterval = Math.round(blockInterval / 2);
                continue;
            }
            
            const blockDateUts : number = <any>(await this.phalaApi.query.timestamp.now.at(blockHash)).toJSON();
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
    
    protected async calculateMiningEra (
        blockNumber : number
    ) : Promise<number>
    {
        const miningStartBlock : number = <any>(await this.phalaApi.query.phalaMining.miningStartBlock()).toJSON();
        const miningHalvingInterval : number = <any>(await this.phalaApi.query.phalaMining.miningHalvingInterval()).toJSON();
        
        return Math.floor((blockNumber - miningStartBlock) / miningHalvingInterval);
    }
    
    /**
     * Process stake pools
     */
    protected async processNextHistoryEntry () : Promise<void>
    {
        this.stakePoolsCount = <any>(await this.phalaApi.query.phalaStakePool.poolCount.at(this.nextEntryBlockHash)).toJSON();
        this._logger.log('Stake pools num', this.stakePoolsCount);
        
        const stakePoolIds = [ ...Array(this.stakePoolsCount).keys() ];
        const chunks = chunk(stakePoolIds, 5);
        
        for (const [ idx, chunk ] of chunks.entries()) {
            const promises = [];
            
            for (const stakePoolId of chunk) {
                console.log(stakePoolId);
                
                const promise = this.processStakePool(stakePoolId);
                promises.push(promise);
            }
            
            await Promise.all(promises);
        }
    }
    
    protected async processStakePool (onChainId : number) : Promise<void>
    {
        const stakePool : StakePool = await this.getOrCreateStakePool(onChainId);
        
        const onChainStakePool : typeof Phala.KhalaTypes.PoolInfo =
            <any>(await this.phalaApi.query.phalaStakePool.stakePools.at(this.nextEntryBlockHash, stakePool.onChainId)).toJSON();
        
        // fetch simple data
        const historyEntry : HistoryEntry = new HistoryEntry({
            stakePool,
            entryNonce: this.appState.value.lastProcessedNonce + 1,
            entryDate: this.nextEntryDate,
            
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
        stakePool.snapshotWorkers = [];
        historyEntry.workersNum = onChainStakePool.workers.length;
        
        let rewardsPerBlock = 0;
        
        for (const workerPublicKey of onChainStakePool.workers) {
            const worker = await this.getOrCreateWorker(workerPublicKey, stakePool);
            worker.isDropped = false;
            
            stakePool.snapshotWorkers.push(worker);
            
            if (!worker.bindingAccount) {
                worker.bindingAccount = (await this.phalaApi.query.phalaMining.workerBindings.at(this.nextEntryBlockHash, workerPublicKey)).toString();
            }
            
            const onChainMiner : typeof Phala.KhalaTypes.MinerInfo =
                <any>(await this.phalaApi.query.phalaMining.miners.at(this.nextEntryBlockHash, worker.bindingAccount)).toJSON();
            if (!onChainMiner) {
                continue;
            }
            
            const workerOnChain : typeof Phala.KhalaTypes.WorkerInfo =
                <any>(await this.phalaApi.query.phalaRegistry.workers(workerPublicKey)).toJSON();
            
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
            
            if (!stakePool.workers.contains(worker)) {
                stakePool.workers.add(worker);
            }
        }
        
        const rewardsAcc = Phala.Utility.decodeBigNumber(onChainStakePool.rewardAcc);
        historyEntry.rewardsTotal = historyEntry.stakeTotal * rewardsAcc;
        
        // update last history entry
        stakePool.lastHistoryEntry = historyEntry;
        
        this._txEntityManager.persist(historyEntry);
        
        this.processedStakePools.push(stakePool);
    }
    
    protected async calculateApr ()
    {
        const budgetPerBlock = Phala.Utility.decodeBigNumber(this.tokenomicParameters.budgetPerBlock);
        const treasuryRatio = Phala.Utility.decodeBigNumber(this.tokenomicParameters.treasuryRatio);
        const rewardsFractionInEra = Math.pow(StakePoolHistoryCrawler.HALVING_FRACTION, this.miningEra);
        
        const totalShare = Object.values(this.workers)
            .filter(worker => !worker.isDropped && worker.isMiningState)
            .reduce((acc, worker) => acc + worker.getShare(), 0);
        
        for (const stakePool of this.processedStakePools) {
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
                * (86400 / this.avgBlockTime);
            
            stakePool.lastHistoryEntry.currentApr = rewardPerBlock
                * rewardsFractionInEra
                * (1 - treasuryRatio)
                * (1 - stakePool.lastHistoryEntry.commission)
                * (31536000 / this.avgBlockTime)
                / stakePool.lastHistoryEntry.stakeTotal;
        }
    }
    
    protected async processAvgStakePools () : Promise<void>
    {
        // sort stake pools
        this.sortedStakePools = this.processedStakePools
            .slice(0, this.stakePoolsCount)
            .filter(sp => sp.lastHistoryEntry.currentApr > 0)
            .sort((a, b) => a.lastHistoryEntry.currentApr > b.lastHistoryEntry.currentApr ? -1 : 1);
        
        // process avg entries
        await this.processAvgStakePool(
            this.specialStakePools[StakePool.SPECIAL_NETWORK_AVG_ID],
            this.sortedStakePools
        );
        
        await this.processAvgStakePool(
            this.specialStakePools[StakePool.SPECIAL_TOP_AVG_ID],
            this.sortedStakePools.slice(0, 100)
        );
    }
    
    protected async processAvgStakePool (
        stakePool : StakePool,
        limitedStakePools : StakePool[]
    ) : Promise<void>
    {
        const oneOfHistoryEntries : HistoryEntry = this.processedStakePools[0].lastHistoryEntry;
        const historyEntry : HistoryEntry = new HistoryEntry({
            stakePool,
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
    
    protected async calculateAvgApr ()
    {
        const entriesNum = Math.ceil(30 / StakePoolHistoryCrawler.HISTORY_ENTRY_INTERVAL);
        
        for (const stakePool of this.processedStakePools) {
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

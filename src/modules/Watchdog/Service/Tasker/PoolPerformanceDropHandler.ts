import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { AbstractHandler } from '#/BackendCore/Service/Tasker/AbstractHandler';
import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { ApiProvider } from '#/Phala/Service/ApiProvider';
import { Utility as PhalaUtility } from '#/Phala/Utility';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { StakePoolObservation } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { Exception } from '#/BackendCore/Exception';
import { RuntimeCache } from '@inti5/cache/RuntimeCache';
import { Inject, Injectable } from '@inti5/object-manager';
import { PromiseAggregator } from '@inti5/utils/PromiseAggregator';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiPromise } from '@polkadot/api';
import { Header } from '@polkadot/types/interfaces/runtime';
import _ from 'lodash';


@Injectable({ tag: 'tasker.handler' })
export class PoolPerformanceDropHandler
    extends AbstractHandler
{
    
    protected static readonly BLOCKS_CHUNK = 3600;
    
    protected static readonly NOTIFICATION_REPEAT_DELAY = 24 * 3600;
    
    
    @Inject({ ctorArgs: [ '🚨 Pool performance drop' ] })
    protected _notificationAggregator : NotificationAggregator;
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _apiProvider : ApiProvider;
    
    @Inject()
    protected _runtimeCache : RuntimeCache;
    
    protected _entityManager : EntityManager;
    
    protected _api : ApiPromise;
    
    
    public async init ()
    {
        this._entityManager = this._entityManagerWrapper.getDirectEntityManager();
        this._api = await this._apiProvider.getApi();
    }
    
    public async postProcess ()
    {
        await this._entityManager.flush();
        await this._notificationAggregator.send();
    }
    
    @Task({
        cronExpr: '0 */12 * * *'
    })
    public async handle ()
    {
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        const observationRepository = this._entityManager.getRepository(StakePoolObservation);
        
        const observations = await observationRepository.findAll();
        const observationGroups = _.groupBy(observations, ob => ob.stakePool.onChainId);
        
        await PromiseAggregator.allSettled(Object.entries(observationGroups), async([ onChainId, observations ]) => {
            const onChainStakePool : typeof KhalaTypes.PoolInfo =
                <any>(await this._api.query.phalaStakePool.stakePools(onChainId)).toJSON();
            
            const rewardsNow : number = 10 ** 12 * PhalaUtility.decodeBigNumber(onChainStakePool.rewardAcc);
            
            const finalizedHead = await this._api.rpc.chain.getFinalizedHead();
            const finalizedBlockHeader : Header = await this._api.rpc.chain.getHeader(finalizedHead);
            const finalizedBlockNumber = finalizedBlockHeader.number.toNumber();
            
            let lastChunkRewards : number;
            let avgRewards : number;
            
            try {
                {
                    const rewardsPrevious = await this._findRewardsAtBlock(
                        Number(onChainId),
                        finalizedBlockNumber - PoolPerformanceDropHandler.BLOCKS_CHUNK
                    );
                    lastChunkRewards = rewardsNow - rewardsPrevious;
                }
                {
                    const rewardsPrevious = await this._findRewardsAtBlock(
                        Number(onChainId),
                        finalizedBlockNumber - 5 * PoolPerformanceDropHandler.BLOCKS_CHUNK
                    );
                    avgRewards = (rewardsNow - rewardsPrevious) / 5;
                }
            }
            catch (e) {
                // unable to calculate avg rewards
                return;
            }
            
            const ratio = lastChunkRewards / avgRewards;
            const dropPercent = (1 - ratio) * 100;
            
            for (const observation of observations) {
                const exceedThreshold : boolean = dropPercent > observation.user.getConfig('poolPerformanceDropThreshold');
                if (exceedThreshold) {
                    const text = '`#' + onChainId + '` rewards performance drop of `' + dropPercent.toFixed(1) + '%`';
                    
                    this._notificationAggregator.aggregate(
                        observation.user.msgChannel,
                        observation.user.msgUserId,
                        text
                    );
                }
            }
        });
    }
    
    protected async _findRewardsAtBlock (onChainId : number, blockNumber : number) : Promise<number>
    {
        const blockHash : string = (await this._api.rpc.chain.getBlockHash(blockNumber)).toString();
        
        const historyStakePool : typeof KhalaTypes.PoolInfo =
            <any>(await this._api.query.phalaStakePool.stakePools.at(blockHash, onChainId)).toJSON();
        if (!historyStakePool) {
            throw new Exception('Unable to fetch history data', 1637407485035);
        }
        
        return 10 ** 12 * PhalaUtility.decodeBigNumber(historyStakePool.rewardAcc);
    }
    
}

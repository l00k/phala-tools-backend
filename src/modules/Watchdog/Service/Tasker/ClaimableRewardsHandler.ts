import { EntityManagerWrapper } from '#/Core/Service/EntityManagerWrapper';
import { AbstractHandler } from '#/Core/Service/Tasker/AbstractHandler';
import { Task } from '#/Core/Service/Tasker/Annotation';
import { MessagingChannel } from '#/Messaging/Service/MessagingProvider';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { ApiProvider } from '#/Phala/Service/ApiProvider';
import { Utility as PhalaUtility } from '#/Phala/Utility';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { NotificationType, StakePoolObservation } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { Utility } from '#/Watchdog/Utility/Utility';
import { RuntimeCache } from '@inti5/cache/RuntimeCache';
import { Inject, Injectable } from '@inti5/object-manager';
import { PromiseAggregator } from '@inti5/utils/PromiseAggregator';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiPromise } from '@polkadot/api';
import _ from 'lodash';


@Injectable({ tag: 'tasker.handler' })
export class ClaimableRewardsHandler
    extends AbstractHandler
{
    
    protected static readonly NOTIFICATION_REPEAT_DELAY = 24 * 3600;
    
    
    @Inject({ ctorArgs: [ '💰 Pending rewards' ] })
    protected notificationAggregator : NotificationAggregator;
    
    @Inject()
    protected entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected apiProvider : ApiProvider;
    
    @Inject()
    protected runtimeCache : RuntimeCache;
    
    protected entityManager : EntityManager;
    
    protected api : ApiPromise;
    
    
    public async init ()
    {
        this.entityManager = this.entityManagerWrapper.getDirectEntityManager();
        this.api = await this.apiProvider.getApi();
    }
    
    public async postProcess ()
    {
        await this.entityManager.flush();
        await this.notificationAggregator.send();
    }
    
    @Task({
        cronExpr: '0 */4 * * *',
    })
    public async handle ()
    {
        const stakePoolRepository = this.entityManager.getRepository(StakePool);
        const observationRepository = this.entityManager.getRepository(StakePoolObservation);
        
        const observations = await observationRepository.findAll();
        const observationGroups = _.groupBy(observations, ob => ob.stakePool.onChainId);
        
        await PromiseAggregator.allSettled(Object.entries(observationGroups), async([ onChainId, observations ]) => {
            const onChainStakePool : typeof KhalaTypes.PoolInfo =
                <any>(await this.api.query.phalaStakePool.stakePools(onChainId)).toJSON();
            
            for (const observation of observations) {
                // notify only if previous notification delay exceeded
                const deltaTime : number = (Date.now() - (observation.getLastNotification(NotificationType.ClaimableRewards) || 0)) / 1000;
                if (deltaTime < ClaimableRewardsHandler.NOTIFICATION_REPEAT_DELAY) {
                    return;
                }
                
                let availableRewardsRaw : number = onChainStakePool.owner === observation.account.address ? onChainStakePool.ownerReward : 0;
                
                const onChainStaker : typeof KhalaTypes.UserStakeInfo =
                    <any>(await this.api.query.phalaStakePool.poolStakers([ onChainStakePool.pid, observation.account.address ])).toJSON();
                if (onChainStaker) {
                    availableRewardsRaw += onChainStaker.availableRewards
                        + (onChainStaker.shares * PhalaUtility.decodeBigNumber(onChainStakePool.rewardAcc) - onChainStaker.rewardDebt);
                }
                
                const availableRewards : number = PhalaUtility.parseRawAmount(availableRewardsRaw);
                
                const rewardsExceedThreshold : boolean = availableRewards > observation.user.getConfig('claimRewardsThreshold');
                if (rewardsExceedThreshold) {
                    // send notifications
                    const text = 'Account: `' + Utility.formatAddress(observation.account.address) + '`\n'
                        + 'Stake pool: `#' + onChainStakePool.pid + '`\n'
                        + 'Amount: `' + Utility.formatCoin(availableRewards, true) + '`\n'
                    ;
                    // todo ld 2022-03-14 16:49:07
                    this.notificationAggregator.aggregate(MessagingChannel.Telegram, observation.user.tgUserId, text);
                }
            }
        });
    }
    
}

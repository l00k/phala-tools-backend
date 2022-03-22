import { EntityManagerWrapper } from '#/Core/Service/EntityManagerWrapper';
import { AbstractHandler } from '#/Core/Service/Tasker/AbstractHandler';
import { Task } from '#/Core/Service/Tasker/Annotation';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { ApiProvider } from '#/Phala/Service/ApiProvider';
import { ObservationMode, StakePoolObservation } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { Utility } from '#/Watchdog/Utility/Utility';
import { RuntimeCache } from '@inti5/cache/RuntimeCache';
import { Inject, Injectable } from '@inti5/object-manager';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiPromise } from '@polkadot/api';
import _ from 'lodash';


@Injectable({ tag: 'tasker.handler' })
export class PendingWithdrawalHandler
    extends AbstractHandler
{
    
    @Inject({ ctorArgs: [ '🚨 Pending withdrawal(s) in queue' ] })
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
        await this.notificationAggregator.send();
    }
    
    @Task({
        cronExpr: '0 */12 * * *'
    })
    public async handle () : Promise<boolean>
    {
        const observationRepository = this.entityManager.getRepository(StakePoolObservation);
        const observations = await observationRepository.find({ mode: ObservationMode.Owner });
        const observationGroups = _.groupBy(observations, ob => ob.stakePool.onChainId);
        
        for (const [ onChainPoolId, observations ] of Object.entries(observationGroups)) {
            const stakePool : typeof KhalaTypes.PoolInfo =
                <any>(await this.api.query.phalaStakePool.stakePools(onChainPoolId)).toJSON();
            
            if (stakePool.withdrawQueue.length) {
                const totalRaw = stakePool.withdrawQueue.reduce((acc, r) => acc + Number(r.shares), 0);
                const totalText = Utility.formatCoin(totalRaw, true, true);
                
                for (const observation of observations) {
                    const text = '`#' + onChainPoolId + '` total `' + totalText + '`';
                    
                    this.notificationAggregator.aggregate(
                        observation.user.messagingChannel,
                        observation.user.chatId,
                        text
                    );
                }
            }
        }
        
        return true;
    }
    
}

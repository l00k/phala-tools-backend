import { Task } from '#/Core/Service/Tasker/Annotation';
import { MessagingChannel } from '#/Messaging/Service/MessagingProvider';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { WorkerState } from '#/Phala/Api/Worker';
import { AbstractIssue } from '#/Watchdog/Domain/Model/AbstractIssue';
import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { ObservationMode, StakePoolObservation } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { AbstractReminderHandler } from '#/Watchdog/Service/Tasker/AbstractReminderHandler';
import { Utility } from '#/Watchdog/Utility/Utility';
import { Inject, Injectable } from '@inti5/object-manager';


@Injectable({ tag: 'tasker.handler' })
export class UnresponsiveWorkerHandler
    extends AbstractReminderHandler
{
    
    protected static readonly ISSUE_CLASS : typeof AbstractIssue = UnresponsiveWorker;
    
    
    @Inject({ ctorArgs: [ '🚨 Worker still in unresponsive state' ] })
    protected notificationAggregator : NotificationAggregator;
    
    
    @Task({
        cronExpr: '*/15 * * * *'
    })
    public async handle () : Promise<boolean>
    {
        const issues : UnresponsiveWorker[] = await this.loadIssues();
        const observationRepository = this.entityManager.getRepository(StakePoolObservation);
        
        for (const issue of issues) {
            const workerState : typeof KhalaTypes.MinerInfo =
                <any>(await this.api.query.phalaMining.miners(issue.workerAccount)).toJSON();
            
            if (
                !workerState
                || workerState.state != WorkerState.MiningUnresponsive
            ) {
                // issue already resolved
                this.entityManager.remove(issue);
                continue;
            }
            
            const observations : StakePoolObservation[] = await observationRepository.find({
                stakePool: issue.stakePool,
                mode: ObservationMode.Owner,
            });
            
            for (const observation of observations) {
                const text = '`#' + String(issue.stakePool.onChainId).padEnd(6, ' ') + Utility.formatPublicKey(issue.workerPubKey) + '`';
                // todo ld 2022-03-14 16:49:07
                this.notificationAggregator.aggregate(MessagingChannel.Telegram, observation.user.tgUserId, text, String(issue.stakePool.id));
            }
        }
        
        return true;
    }
    
}

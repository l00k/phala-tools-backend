import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { WorkerState } from '#/Phala/Domain/Model';
import { AbstractIssue } from '#/Watchdog/Domain/Model/AbstractIssue';
import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { ObservationMode, StakePoolObservation } from '#/Watchdog/Domain/Model/StakePool/StakePoolObservation';
import { AbstractReminderHandler } from '#/Watchdog/Service/Tasker/AbstractReminderHandler';
import { Inject, Injectable } from '@inti5/object-manager';


@Injectable({ tag: 'tasker.handler' })
export class UnresponsiveWorkerHandler
    extends AbstractReminderHandler
{
    
    protected static readonly ISSUE_CLASS : typeof AbstractIssue = UnresponsiveWorker;
    
    
    @Inject({ ctorArgs: [ '🚨 Worker still in unresponsive state' ] })
    protected _notificationAggregator : NotificationAggregator;
    
    
    protected _unresponsiveWorkersCounter : { [onChainId : number] : number } = {};
    
    
    @Task({
        cronExpr: '*/15 * * * *'
    })
    public async handle () : Promise<boolean>
    {
        const issues : UnresponsiveWorker[] = await this._loadIssues();
        const observationRepository = this._entityManager.getRepository(StakePoolObservation);
        
        for (const issue of issues) {
            const workerState : typeof KhalaTypes.MinerInfo =
                <any>(await this._api.query.phalaMining.miners(issue.workerAccount)).toJSON();
            
            // todo ld 2022-03-21 22:02:41
            // confirm unresponsivness
            // if (
            //     !workerState
            //     || workerState.state != WorkerState.MiningUnresponsive
            // ) {
            //     // issue already resolved
            //     this._entityManager.remove(issue);
            //     continue;
            // }
            
            if (!this._unresponsiveWorkersCounter[issue.stakePool.onChainId]) {
                this._unresponsiveWorkersCounter[issue.stakePool.onChainId] = 0;
            }
            
            ++this._unresponsiveWorkersCounter[issue.stakePool.onChainId];
        }
        
        return true;
    }
    
    public async postProcess ()
    {
        await this._prepareMessages();
        
        // clear counters
        this._unresponsiveWorkersCounter = {};
        
        await super.postProcess();
    }
    
    protected async _prepareMessages ()
    {
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        const stakePoolObservationRepository = this._entityManager.getRepository(StakePoolObservation);
        
        for (const [ onChainId, unresponsiveCount ] of Object.entries(this._unresponsiveWorkersCounter)) {
            if (unresponsiveCount == 0) {
                continue;
            }
        
            // fetch stake pool
            const stakePool : StakePool = await stakePoolRepository.findOne({ onChainId: Number(onChainId) });
            if (!stakePool) {
                // no stake pool entry
                continue;
            }
            
            // inform owners (only!)
            const stakePoolObservations = await stakePoolObservationRepository.find(
                {
                    stakePool,
                    mode: ObservationMode.Owner,
                }
            );
            if (!stakePoolObservations.length) {
                // no stake pool observations
                return;
            }
            
            for (const observation of stakePoolObservations) {
                if (observation.user.getConfig('delayUnresponsiveWorkerNotification')) {
                    continue;
                }
                
                const text = unresponsiveCount == 1
                    ? `1 worker is in unresponsive state`
                    : `${unresponsiveCount} workers are in unresponsive state`;
                
                this._notificationAggregator.aggregate(
                    observation.user.msgChannel,
                    observation.user.msgUserId,
                    text
                );
            }
        }
    }
    
}

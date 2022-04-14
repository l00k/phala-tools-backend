import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { WorkerState } from '#/Stats/Domain/Model/Worker';
import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { Observation, ObservationMode } from '#/Watchdog/Domain/Model/Observation';
import { ObservationType } from '#/Watchdog/Domain/Model/Observation/ObservationNotifications';
import { AbstractCrawler } from '#/Watchdog/Service/PeriodicCrawler/AbstractCrawler';


export class UnresponsiveWorkerReminderCrawler
    extends AbstractCrawler
{
    
    protected readonly _messageTitle : string = '🚨 Worker still in unresponsive state';
    protected readonly _observationType : ObservationType = ObservationType.UnresponsiveWorker;
    protected readonly _observationMode : ObservationMode = ObservationMode.Owner;
    
    
    protected async _getObservedValuePerStakePool (onChainId : number) : Promise<number>
    {
        const issueRepository = this._entityManager.getRepository(UnresponsiveWorker);
        const issues : UnresponsiveWorker[] = await issueRepository.find({
            stakePool: {
                onChainId
            }
        });
        
        let count = 0;
        
        for (const issue of issues) {
            const workerStateRaw : any = await this._api.query.phalaMining.miners(issue.workerAccount);
            const workerState : typeof KhalaTypes.MinerInfo = workerStateRaw.toJSON();
            
            // confirm unresponsivness
            if (
                !workerState
                || workerState.state != WorkerState.MiningUnresponsive
            ) {
                // issue already resolved
                this._entityManager.remove(issue);
                continue;
            }
            
            ++count;
        }
        
        return count > 0
            ? count
            : null;
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number
    ) : string
    {
        return observedValue == 1
            ? `1 worker is in unresponsive state`
            : `${observedValue} workers are in unresponsive state`;
    }
    
}

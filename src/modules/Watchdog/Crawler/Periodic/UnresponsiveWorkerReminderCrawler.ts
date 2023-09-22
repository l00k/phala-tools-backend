import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { WorkerState } from '#/Watchdog/Domain/Type/WorkerState';
import { AbstractPeriodicCrawler } from '#/Watchdog/Service/AbstractPeriodicCrawler';
import { RuntimeException } from '@inti5/utils/Exception';
import moment from 'moment';
import { NotificationKind } from 'rxjs';


export class UnresponsiveWorkerReminderCrawler
    extends AbstractPeriodicCrawler
{

    protected static readonly UNRESPONSIVNESS_THRESHOLD : number = 300;
    
    protected readonly _messageTitle : string = '🚨 Worker still in unresponsive state';
    protected readonly _observationType : ObservationType = ObservationType.UnresponsiveWorker;
    protected readonly _observationMode : ObservationMode = ObservationMode.Owner;
    
    
    protected _stakePoolWorkers : Record<number, any[]> = {}
    
    protected async _getObservedValuePerObservation (
        onChainId : number,
        observation : Observation
    ) : Promise<number>
    {
        const config = observation.config[ObservationType.UnresponsiveWorker];
    
        const issueRepository = this._entityManager.getRepository(UnresponsiveWorker);
        const issues : UnresponsiveWorker[] = await issueRepository.find({
            stakePool: {
                onChainId
            }
        });
        
        // fetch state
        let onChainMiners = this._stakePoolWorkers[onChainId];
        if (!onChainMiners) {
            this._stakePoolWorkers[onChainId] = onChainMiners = (
                await this._api.query
                    .phalaComputation.sessions
                    .multi(
                        issues.map(issue => issue.workerAccount)
                    )
            ).map(raw => raw.unwrap());
        }
        
        if (onChainMiners.length != issues.length) {
            throw new RuntimeException(
                'Workers data missing',
                1662038027783
            );
        }
        
        let weightCount = 0;
        
        for (let idx = 0; idx < issues.length; ++idx) {
            const issue = issues[idx];
            const onChainMiner = onChainMiners[idx];
            
            // confirm unresponsivness
            if (
                !onChainMiner
                || onChainMiner.state.type != WorkerState.WorkerUnresponsive
            ) {
                // issue already resolved
                this._entityManager.remove(issue);
                continue;
            }
            
            const deltaTime = moment.utc().diff(issue.occurrenceDate, 'seconds');
            weightCount += Math.floor(
                deltaTime / config.frequency
            );
        }
        
        return weightCount > 0
            ? weightCount
            : null
            ;
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number
    ) : string
    {
        return '`#' + onChainId + '` '
            + observedValue + ' worker(s) in unresponsive state';
    }
    
}

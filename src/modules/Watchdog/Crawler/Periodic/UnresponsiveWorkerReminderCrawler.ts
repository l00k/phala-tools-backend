import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { WorkerState } from '#/Watchdog/Domain/Type/WorkerState';
import { AbstractPeriodicCrawler } from '#/Watchdog/Service/AbstractPeriodicCrawler';
import { RuntimeException } from '@inti5/utils/Exception';
import moment from 'moment';


export class UnresponsiveWorkerReminderCrawler
    extends AbstractPeriodicCrawler
{

    protected static readonly UNRESPONSIVNESS_THRESHOLD : number = 5;
    
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
        
        // fetch state
        const onChainMiners = (
            await this._api.query
                .phalaComputation.sessions
                .multi(
                    issues.map(issue => issue.workerAccount)
                )
        ).map(raw => raw.unwrap());
        
        if (onChainMiners.length != issues.length) {
            throw new RuntimeException(
                'Workers data missing',
                1662038027783
            );
        }
        
        let count = 0;
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
            
            // confirm it is above threshold
            const deltaTime = moment.utc().diff(issue.occurrenceDate, 'minutes');
            if (deltaTime < UnresponsiveWorkerReminderCrawler.UNRESPONSIVNESS_THRESHOLD) {
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
        return '`#' + onChainId + '` '
            + observedValue + ' worker(s) in unresponsive state';
    }
    
}

import { StakePool } from '#/Phala/Domain/Model';
import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { WorkerState } from '#/Watchdog/Domain/Type/WorkerState';
import { AbstractEventCrawler } from '#/Watchdog/Service/EventCrawler/AbstractEventCrawler';
import { Listen } from '#/Watchdog/Service/EventCrawler/Annotation';
import { Event, EventType } from '#/Watchdog/Service/EventCrawler/Event';
import { Injectable } from '@inti5/object-manager';


@Injectable({ tag: 'watchdog.crawler.handler' })
export class MinerEnterUnresponsiveCrawler
    extends AbstractEventCrawler
{
    
    protected readonly _messageTitle : string = '🚨 Worker enter unresponsive state';
    protected readonly _observationType : ObservationType = ObservationType.UnresponsiveWorker;
    protected readonly _observationMode : ObservationMode = ObservationMode.Owner;
    
    
    @Listen([
        EventType.WorkerEnterUnresponsive
    ])
    protected async _handle (event : Event) : Promise<boolean>
    {
        const workerAccount : string = event.data[0];
        
        // confirm unresponsivness
        const workerState = (
            await this._api.query
                .phalaComputation.sessions(workerAccount)
        ).unwrap();
        if (
            !workerState
            || workerState.state.type != WorkerState.WorkerUnresponsive
        ) {
            return false;
        }
        
        const workerPubKey = (
            await this._api.query
                .phalaComputation.sessionBindings(workerAccount)
        ).toString();
        
        const onChainId : number = <any>(
            await this._api.query
            .phalaStakePoolv2.workerAssignments(workerPubKey)
        ).toJSON();
        
        // load pool
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        const stakePool : StakePool = await stakePoolRepository.findOne({ onChainId });
        if (!stakePool) {
            // skip - no observation for it
            return false;
        }
        
        // create issue if it doesn't exists yet
        const issueRepository = this._entityManager.getRepository(UnresponsiveWorker);
        const issueAlreadyExists = await issueRepository.findOne({
            stakePool,
            workerAccount,
            workerPubKey,
        });
        
        if (!issueAlreadyExists) {
            const issue = new UnresponsiveWorker({
                stakePool,
                workerAccount,
                workerPubKey,
                occurrenceDate: event.blockDate,
            }, this._entityManager);
            
            this._entityManager.persist(issue);
        }
        
        return true;
    }
    
}

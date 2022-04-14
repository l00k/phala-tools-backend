import { KhalaTypes } from '#/Phala';
import { StakePool } from '#/Phala/Domain/Model';
import { WorkerState } from '#/Stats/Domain/Model/Worker';
import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
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
    
    
    protected _unresponsiveWorkersCounter : { [onChainId : number] : number } = {};
    
    
    @Listen([
        EventType.MinerEnterUnresponsive
    ])
    protected async _handle (event : Event) : Promise<boolean>
    {
        const workerAccount : string = event.data[0];
        
        // confirm unresponsivness
        const workerStateRaw : any = await this._api.query.phalaMining.miners(workerAccount);
        const workerState : typeof KhalaTypes.MinerInfo = workerStateRaw.toJSON();
        if (
            !workerState
            || workerState.state != WorkerState.MiningUnresponsive
        ) {
            return false;
        }
        
        const workerPubKey = (await this._api.query.phalaMining.minerBindings(workerAccount)).toString();
        const onChainIdRaw : any = await this._api.query.phalaStakePool.workerAssignments(workerPubKey);
        const onChainId : number = Number(onChainIdRaw.toJSON());
        
        // load pool
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        const stakePool : StakePool = await stakePoolRepository.findOne({ onChainId });
        if (!stakePool) {
            // skip - no observation for it
            return false;
        }
        
        if (!this._unresponsiveWorkersCounter[onChainId]) {
            this._unresponsiveWorkersCounter[onChainId] = 0;
        }
        
        ++this._unresponsiveWorkersCounter[onChainId];
        
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
    
    public async postProcess ()
    {
        await this._handleGrouppedEvents();
        
        // clear counters
        this._unresponsiveWorkersCounter = {};
        
        await super.postProcess();
    }
    
    protected async _handleGrouppedEvents ()
    {
        for (const [ onChainIdStr, unresponsiveCount ] of Object.entries(this._unresponsiveWorkersCounter)) {
            const onChainId = Number(onChainIdStr);
            
            await this._processObservations(
                onChainId,
                unresponsiveCount
            );
        }
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number,
        additionalData : any = null
    ) : string
    {
        return '`#' + onChainId + '` '
            + observedValue + 'worker(s) in unresponsive state';
    }
    
}

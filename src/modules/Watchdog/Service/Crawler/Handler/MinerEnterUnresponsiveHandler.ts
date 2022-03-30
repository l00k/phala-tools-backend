import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { ObservationMode, StakePoolObservation } from '#/Watchdog/Domain/Model/StakePool/StakePoolObservation';
import { WatchdogStakePool } from '#/Watchdog/Domain/Model/WatchdogStakePool';
import { AbstractHandler } from '#/Watchdog/Service/Crawler/AbstractHandler';
import { Listen } from '#/Watchdog/Service/Crawler/Annotation';
import { Event, EventType } from '#/Watchdog/Service/Crawler/Event';
import { Inject, Injectable } from '@inti5/object-manager';


@Injectable({ tag: 'pw.crawler.handler' })
export class MinerEnterUnresponsiveHandler
    extends AbstractHandler
{
    
    @Inject({ ctorArgs: [ '🚨 Worker enter unresponsive state' ] })
    protected _notificationAggregator : NotificationAggregator;
    
    
    protected _unresponsiveWorkersCounter : { [onChainId : number] : number } = {};
    
    
    @Listen([
        EventType.MinerEnterUnresponsive
    ])
    protected async _handle (event : Event) : Promise<boolean>
    {
        const workerAccount : string = event.data[0];
        
        // todo ld 2022-03-21 21:50:43
        // confirm unresponsivness
        // const workerState : typeof KhalaTypes.MinerInfo =
        //     <any>(await this._api.query.phalaMining.miners(workerAccount)).toJSON();
        // if (
        //     !workerState
        //     || workerState.state != WorkerState.MiningUnresponsive
        // ) {
        //     return false;
        // }
        
        const workerPubKey = (await this._api.query.phalaMining.minerBindings(workerAccount)).toString();
        const onChainId : number = <number>(await this._api.query.phalaStakePool.workerAssignments(workerPubKey)).toJSON();
        
        // load pool
        const stakePoolRepository = this._entityManager.getRepository(WatchdogStakePool);
        const stakePool : WatchdogStakePool = await stakePoolRepository.findOne({ onChainId: Number(onChainId) });
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
    
    public async chunkPostProcess ()
    {
        await this._prepareMessages();
        
        // clear counters
        this._unresponsiveWorkersCounter = {};
        
        await super.chunkPostProcess();
    }
    
    protected async _prepareMessages ()
    {
        const stakePoolRepository = this._entityManager.getRepository(WatchdogStakePool);
        const stakePoolObservationRepository = this._entityManager.getRepository(StakePoolObservation);
        
        for (const [ onChainId, unresponsiveCount ] of Object.entries(this._unresponsiveWorkersCounter)) {
            if (unresponsiveCount == 0) {
                continue;
            }
            
            // fetch stake pool
            const stakePool : WatchdogStakePool = await stakePoolRepository.findOne({ onChainId: Number(onChainId) });
            if (!stakePool) {
                // no stake pool entry
                continue;
            }
            
            // inform owners (only!)
            const stakePoolObservations = await stakePoolObservationRepository.find({
                stakePool,
                mode: ObservationMode.Owner,
            });
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

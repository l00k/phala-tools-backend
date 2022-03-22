import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { WorkerState } from '#/Phala/Api/Worker';
import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { ObservationMode, StakePoolObservation } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { AbstractHandler } from '#/Watchdog/Service/Crawler/AbstractHandler';
import { Listen } from '#/Watchdog/Service/Crawler/Annotation';
import { Event, EventType } from '#/Watchdog/Service/Crawler/Event';
import { Inject, Injectable } from '@inti5/object-manager';


@Injectable({ tag: 'pw.crawler.handler' })
export class MinerEnterUnresponsiveHandler
    extends AbstractHandler
{
    
    @Inject({ ctorArgs: [ '🚨 Worker enter unresponsive state' ] })
    protected notificationAggregator : NotificationAggregator;
    
    
    protected unresponsiveWorkersCounter : { [onChainId : number] : number } = {};
    
    
    @Listen([
        EventType.MinerEnterUnresponsive
    ])
    protected async handle (event : Event) : Promise<boolean>
    {
        const workerAccount : string = event.data[0];
        
        // confirm unresponsivness
        // todo ld 2022-03-21 21:50:43
        // const workerState : typeof KhalaTypes.MinerInfo =
        //     <any>(await this.api.query.phalaMining.miners(workerAccount)).toJSON();
        // if (
        //     !workerState
        //     || workerState.state != WorkerState.MiningUnresponsive
        // ) {
        //     return false;
        // }
        
        const workerPubKey = (await this.api.query.phalaMining.minerBindings(workerAccount)).toString();
        const onChainId : number = <number>(await this.api.query.phalaStakePool.workerAssignments(workerPubKey)).toJSON();
        
        // load pool
        const stakePoolRepository = this.entityManager.getRepository(StakePool);
        const stakePool : StakePool = await stakePoolRepository.findOne({ onChainId: Number(onChainId) });
        if (!stakePool) {
            // skip - no observation for it
            return false;
        }
        
        if (!this.unresponsiveWorkersCounter[onChainId]) {
            this.unresponsiveWorkersCounter[onChainId] = 0;
        }
        
        ++this.unresponsiveWorkersCounter[onChainId];
        
        // create issue if it doesn't exists yet
        const issueRepository = this.entityManager.getRepository(UnresponsiveWorker);
        
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
            }, this.entityManager);
            
            this.entityManager.persist(issue);
        }
        
        return true;
    }
    
    public async chunkPostProcess ()
    {
        await this.prepareMessages();
        
        // clear counters
        this.unresponsiveWorkersCounter = {};
        
        await super.chunkPostProcess();
    }
    
    protected async prepareMessages ()
    {
        const stakePoolRepository = this.entityManager.getRepository(StakePool);
        const stakePoolObservationRepository = this.entityManager.getRepository(StakePoolObservation);
        
        for (const [ onChainId, unresponsiveCount ] of Object.entries(this.unresponsiveWorkersCounter)) {
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
                
                this.notificationAggregator.aggregate(
                    observation.user.msgChannel,
                    observation.user.msgUserId,
                    text
                );
            }
        }
    }
    
}

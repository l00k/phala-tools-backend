import { MessagingChannel } from '#/Messaging/Service/MessagingProvider';
import { AbstractHandler } from '#/Watchdog/Service/Crawler/AbstractHandler';
import { Event, EventType } from '#/Watchdog/Service/Crawler/Event';
import { Inject, Injectable } from '@inti5/object-manager';
import { Listen } from '#/Watchdog/Service/Crawler/Annotation';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { StakePoolObservation, ObservationMode } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { Utility } from '#/Watchdog/Utility/Utility';
import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { WorkerState } from '#/Phala/Api/Worker';


@Injectable({ tag: 'pw.crawler.handler' })
export class MinerEnterUnresponsiveHandler
    extends AbstractHandler
{

    @Inject({ ctorArgs: [ '🚨 Worker enter unresponsive state' ] })
    protected notificationAggregator : NotificationAggregator;


    @Listen([
        EventType.MinerEnterUnresponsive
    ])
    protected async handle (event : Event) : Promise<boolean>
    {
        const stakePoolRepository = this.entityManager.getRepository(StakePool);
        const stakePoolObservationRepository = this.entityManager.getRepository(StakePoolObservation);

        const workerAccount : string = event.data[0];

        // confirm unresponsivness
        const workerState : typeof KhalaTypes.MinerInfo =
            <any>(await this.api.query.phalaMining.miners(workerAccount)).toJSON();
        if (
            !workerState
            || workerState.state != WorkerState.MiningUnresponsive
        ) {
            return false;
        }

        const workerPubKey = (await this.api.query.phalaMining.minerBindings(workerAccount)).toString();
        const onChainStakePoolId : number = <number>(await this.api.query.phalaStakePool.workerAssignments(workerPubKey)).toJSON();

        // fetch stake pool
        const stakePool : StakePool = await stakePoolRepository.findOne({ onChainId: onChainStakePoolId });
        if (!stakePool) {
            // no stake pool entry
            return false;
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
            return false;
        }

        const workerShortKey = Utility.formatPublicKey(workerPubKey);

        for (const observation of stakePoolObservations) {
            if (observation.user.getConfig('delayUnresponsiveWorkerNotification')) {
                continue;
            }

            const text = '`#' + String(onChainStakePoolId).padEnd(6, ' ') + workerShortKey + '`';
            
            // todo ld 2022-03-14 16:49:07
            this.notificationAggregator.aggregate(MessagingChannel.Telegram, observation.user.tgUserId, text, String(stakePool.id));
        }

        const issueRepository = this.entityManager.getRepository(UnresponsiveWorker);
        const issueAlreadyExists = await issueRepository.findOne({
            stakePool,
            workerAccount,
            workerPubKey,
        });

        // create issue if it doesn't exists yet
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

}

import { MessagingChannel } from '#/Messaging/Service/MessagingProvider';
import { AbstractHandler } from '#/Watchdog/Service/Crawler/AbstractHandler';
import { Event, EventType } from '#/Watchdog/Service/Crawler/Event';
import { Inject, Injectable } from '@inti5/object-manager';
import { Listen } from '#/Watchdog/Service/Crawler/Annotation';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { StakePoolObservation, ObservationMode } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { Utility } from '#/Watchdog/Utility/Utility';
import { Utility as PhalaUtility } from '#/Phala/Utility';


@Injectable({ tag: 'pw.crawler.handler' })
export class WithdrawalHandler
    extends AbstractHandler
{

    @Inject({ ctorArgs: [ '😥 Withdrawal from your pool' ] })
    protected notificationAggregator : NotificationAggregator;


    @Listen([
        EventType.Withdrawal
    ])
    protected async handle (event : Event) : Promise<boolean>
    {
        const stakePoolRepository = this.entityManager.getRepository(StakePool);
        const stakePoolObservationRepository = this.entityManager.getRepository(StakePoolObservation);

        const onChainStakePoolId : number = Number(event.data[0]);
        const delegator : string = String(event.data[1]);
        const withdrawAmount : number = PhalaUtility.parseRawAmount(Number(event.data[2]));

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
                mode: ObservationMode.Owner
            }
        );
        if (!stakePoolObservations.length) {
            // no stake pool observations
            return false;
        }

        for (const observation of stakePoolObservations) {
            const threshold = observation.user.getConfig('withdrawalThreshold');
            if (withdrawAmount < threshold) {
                continue;
            }

            const text = '`' + Utility.formatAddress(delegator) + '` withdrawed '
                + '`' + Utility.formatCoin(withdrawAmount, true) + '` from pool '
                + '`#' + onChainStakePoolId + '`';

            // todo ld 2022-03-14 16:49:07
            this.notificationAggregator.aggregate(MessagingChannel.Telegram, observation.user.tgUserId, text);
        }

        return true;
    }

}

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


@Injectable({ tag: 'pw.crawler.handler' })
export class PoolCommissionSetHandler
    extends AbstractHandler
{

    @Inject({ ctorArgs: [ '🚨 Pool owner changed commission' ] })
    protected notificationAggregator : NotificationAggregator;


    @Listen([
        EventType.PoolCommissionSet
    ])
    protected async handle (event : Event) : Promise<boolean>
    {
        const stakePoolRepository = this.entityManager.getRepository(StakePool);
        const stakePoolObservationRepository = this.entityManager.getRepository(StakePoolObservation);

        const onChainStakePoolId : number = Number(event.data[0]);
        const newCommissionPercent : number = Number(event.data[1]) / 10000;

        // fetch stake pool
        const stakePool : StakePool = await stakePoolRepository.findOne({ onChainId: onChainStakePoolId });
        if (!stakePool) {
            // no stake pool entry
            return false;
        }

        // inform delegators (only!)
        const stakePoolObservations = await stakePoolObservationRepository.find(
            {
                stakePool,
                mode: ObservationMode.Delegator
            }
        );
        if (!stakePoolObservations.length) {
            // no stake pool observations
            return false;
        }

        // fetch previous commission value
        const previousBlockHash : string =
            (await this.api.rpc.chain.getBlockHash(event.blockNumber - 1)).toString();

        const onChainStakePoolBefore : typeof KhalaTypes.PoolInfo =
            <any> (await this.api.query.phalaStakePool.stakePools.at(previousBlockHash, onChainStakePoolId)).toJSON();

        const previousCommissionPercent = onChainStakePoolBefore.payoutCommission / 10000;
        const commissionDelta = newCommissionPercent - previousCommissionPercent;

        for (const observation of stakePoolObservations) {
            const threshold = observation.user.getConfig('changeCommissionThreshold');
            if (Math.abs(commissionDelta) < threshold) {
                continue;
            }

            const text = '`#' + String(onChainStakePoolId) + '` '
                + (commissionDelta < 0 ? 'decreased' : 'increased')
                + ' by `' + Math.abs(commissionDelta).toFixed(1) + 'pp` to `' + newCommissionPercent.toFixed(1) + '%`';

            // todo ld 2022-03-14 16:49:07
            this.notificationAggregator.aggregate(MessagingChannel.Telegram, observation.user.tgUserId, text);
        }

        return true;
    }

}

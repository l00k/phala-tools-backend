import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { StakePool } from '#/Phala/Domain/Model';
import { Utility as PhalaUtility } from '#/Phala/Utility';
import { ObservationMode, StakePoolObservation } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { AbstractHandler } from '#/Watchdog/Service/Crawler/AbstractHandler';
import { Listen } from '#/Watchdog/Service/Crawler/Annotation';
import { Event, EventType } from '#/Watchdog/Service/Crawler/Event';
import { Utility } from '#/Watchdog/Utility/Utility';
import { Inject, Injectable } from '@inti5/object-manager';


@Injectable({ tag: 'watchdog.crawler.handler' })
export class WithdrawalHandler
    extends AbstractHandler
{
    
    @Inject({ ctorArgs: [ '😥 Withdrawal from your pool' ] })
    protected _notificationAggregator : NotificationAggregator;
    
    
    @Listen([
        EventType.Withdrawal
    ])
    protected async _handle (event : Event) : Promise<boolean>
    {
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        const stakePoolObservationRepository = this._entityManager.getRepository(StakePoolObservation);
        
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
            
            this._notificationAggregator.aggregate(
                observation.user.msgChannel,
                observation.user.msgUserId,
                text
            );
        }
        
        return true;
    }
    
}

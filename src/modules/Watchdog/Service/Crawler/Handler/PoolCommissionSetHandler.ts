import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { ObservationMode, StakePoolObservation } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { AbstractHandler } from '#/Watchdog/Service/Crawler/AbstractHandler';
import { Listen } from '#/Watchdog/Service/Crawler/Annotation';
import { Event, EventType } from '#/Watchdog/Service/Crawler/Event';
import { Inject, Injectable } from '@inti5/object-manager';


@Injectable({ tag: 'pw.crawler.handler' })
export class PoolCommissionSetHandler
    extends AbstractHandler
{
    
    @Inject({ ctorArgs: [ '🚨 Pool owner changed commission' ] })
    protected _notificationAggregator : NotificationAggregator;
    
    
    @Listen([
        EventType.PoolCommissionSet
    ])
    protected async _handle (event : Event) : Promise<boolean>
    {
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        const stakePoolObservationRepository = this._entityManager.getRepository(StakePoolObservation);
        
        const onChainId : number = Number(event.data[0]);
        const newCommissionPercent : number = Number(event.data[1]) / 10000;
        
        // fetch stake pool
        const stakePool : StakePool = await stakePoolRepository.findOne({ onChainId: onChainId });
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
            (await this._api.rpc.chain.getBlockHash(event.blockNumber - 1)).toString();
        
        const onChainStakePoolBefore : typeof KhalaTypes.PoolInfo =
            <any>(await this._api.query.phalaStakePool.stakePools.at(previousBlockHash, onChainId)).toJSON();
        
        const previousCommissionPercent = onChainStakePoolBefore.payoutCommission / 10000;
        const commissionDelta = newCommissionPercent - previousCommissionPercent;
        
        for (const observation of stakePoolObservations) {
            const threshold = observation.user.getConfig('changeCommissionThreshold');
            if (Math.abs(commissionDelta) < threshold) {
                continue;
            }
            
            const text = '`#' + String(onChainId) + '` '
                + (commissionDelta < 0 ? 'decreased' : 'increased')
                + ' by `' + Math.abs(commissionDelta).toFixed(1) + '%` to `' + newCommissionPercent.toFixed(1) + '%`';
            
            this._notificationAggregator.aggregate(
                observation.user.msgChannel,
                observation.user.msgUserId,
                text
            );
        }
        
        return true;
    }
    
}

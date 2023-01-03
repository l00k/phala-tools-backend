import { StakePool } from '#/Phala/Domain/Model';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { AbstractEventCrawler } from '#/Watchdog/Service/EventCrawler/AbstractEventCrawler';
import { Listen } from '#/Watchdog/Service/EventCrawler/Annotation';
import { Event, EventType } from '#/Watchdog/Service/EventCrawler/Event';
import { Injectable } from '@inti5/object-manager';


@Injectable({ tag: 'watchdog.crawler.handler' })
export class PoolCommissionSetCrawler
    extends AbstractEventCrawler
{
    
    protected readonly _messageTitle : string = '🚨 Pool owner changed commission';
    protected readonly _observationType : ObservationType = ObservationType.PoolCommissionChange;
    protected readonly _observationMode : ObservationMode = ObservationMode.Delegator;
    
    
    @Listen([
        EventType.PoolCommissionSet
    ])
    protected async _handleEvent (event : Event) : Promise<boolean>
    {
        const observationRepository = this._entityManager.getRepository(Observation);
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        
        const onChainId : number = Number(event.data[0]);
        const newCommissionPercent : number = Number(event.data[1]) / 10000;
        
        // fetch stake pool
        const stakePool : StakePool = await stakePoolRepository.findOne({ onChainId: onChainId });
        if (!stakePool) {
            // no stake pool entry
            return false;
        }
        
        const stakePoolObservationCount = await observationRepository.count({
            stakePool,
            mode: ObservationMode.Delegator
        });
        if (!stakePoolObservationCount) {
            // no observations
            return false;
        }
        
        // fetch previous commission value
        const previousBlockHash : string = (await this._api.rpc.chain.getBlockHash(event.blockNumber - 1)).toString();
        
        const onChainStakePoolBeforeWrapped = (
            await this._api.query.phalaBasePool.pools.at(previousBlockHash, onChainId)
        ).unwrap();
        const onChainStakePoolBefore = onChainStakePoolBeforeWrapped.asStakePool;
        
        const previousCommissionPercent = Number(onChainStakePoolBefore.payoutCommission) / 10000;
        const commissionDelta = newCommissionPercent - previousCommissionPercent;
        
        await this._processObservations(
            onChainId,
            commissionDelta,
            {
                previous: previousCommissionPercent,
                current: newCommissionPercent,
            }
        );
        
        return true;
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number,
        additionalData : { previous : number, current : number }
    ) : string
    {
        return '`#' + onChainId + '` '
            + (observedValue < 0 ? 'decreased' : 'increased')
            + ' from `' + additionalData.previous.toFixed(1) + '%`'
            + ' to `' + additionalData.current.toFixed(1) + '%`';
    }
    
}

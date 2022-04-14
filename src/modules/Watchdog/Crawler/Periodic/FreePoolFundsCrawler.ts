import { Utility as PhalaUtility } from '#/Phala';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { AbstractPeriodicCrawler } from '#/Watchdog/Service/AbstractPeriodicCrawler';
import { Utility } from '#/Watchdog/Utility/Utility';


export class FreePoolFundsCrawler
    extends AbstractPeriodicCrawler
{
    
    protected readonly _messageTitle : string = '🤑 Free funds in pools';
    protected readonly _observationType : ObservationType = ObservationType.FreePoolFunds;
    protected readonly _observationMode : ObservationMode = ObservationMode.Owner;
    
    
    protected async _getObservedValuePerStakePool (onChainId : number) : Promise<number>
    {
        const onChainStakePoolRaw : any = await this._api.query.phalaStakePool.stakePools(onChainId);
        const onChainStakePool : typeof KhalaTypes.PoolInfo = onChainStakePoolRaw.toJSON();
        
        return PhalaUtility.parseRawAmount(onChainStakePool.freeStake);
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number
    ) : string
    {
        const totalText = Utility.formatCoin(observedValue, true);
        
        return '`#' + onChainId + '` total free funds: `' + totalText + '`';
    }
    
}

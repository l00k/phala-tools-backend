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
        // todo ld 2022-12-23 20:40:10
        return 0;
    
        const stakePoolBase : any = <any>(
            await this._api.query.phalaBasePool.pools(onChainId)
        ).toJSON();
        const stakePool : typeof KhalaTypes.PoolInfo = stakePoolBase.stakePool;
        
        return PhalaUtility.parseRawAmount(stakePool.freeStake);
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

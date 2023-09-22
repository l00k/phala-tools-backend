import { Utility as PhalaUtility } from '#/Phala';
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
    
    
    protected async _getObservedValuePerStakePool (
        onChainId : number
    ) : Promise<[ number, string ]>
    {
        const stakePoolWrapped = (
            await this._api.query.phalaBasePool.pools(onChainId)
        ).unwrapOr(null);
        if (!stakePoolWrapped) {
            return null;
        }
        
        const stakePool = stakePoolWrapped.isStakePool
            ? stakePoolWrapped.asStakePool
            : stakePoolWrapped.asVault
            ;
        
        const assets = (
            <any> await this._api.query
                .assets.account(10000, stakePool.basepool.poolAccountId)
        ).unwrapOr(null);
        if (!assets) {
            return null;
        }
        
        return [
            PhalaUtility.parseRawAmount(assets.balance),
            undefined
        ];
    }
    
    protected _prepareGeneralMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number
    ) : string
    {
        const totalText = Utility.formatCoin(observedValue, true);
        
        return '`#' + onChainId + '` total free funds: `' + totalText + '`';
    }
    
}

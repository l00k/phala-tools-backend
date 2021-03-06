import { Utility as PhalaUtility } from '#/Phala';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { AbstractPeriodicCrawler } from '#/Watchdog/Service/AbstractPeriodicCrawler';
import { Utility } from '#/Watchdog/Utility/Utility';


export class PendingWithdrawalCrawler
    extends AbstractPeriodicCrawler
{
    
    protected readonly _messageTitle : string = '🚨 Pending withdrawal(s) in queue';
    protected readonly _observationType : ObservationType = ObservationType.PendingWithdrawals;
    protected readonly _observationMode : ObservationMode = ObservationMode.Owner;
    
    
    protected async _getObservedValuePerStakePool (onChainId : number) : Promise<number>
    {
        const onChainStakePoolRaw : any = await this._api.query.phalaStakePool.stakePools(onChainId);
        const onChainStakePool : typeof KhalaTypes.PoolInfo = onChainStakePoolRaw.toJSON();
        
        if (onChainStakePool.withdrawQueue.length == 0) {
            return null;
        }
        
        const totalRaw = onChainStakePool.withdrawQueue.reduce((acc, r) => acc + Number(r.shares), 0);
        return PhalaUtility.parseRawAmount(totalRaw);
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number
    ) : string
    {
        const totalText = Utility.formatCoin(observedValue, true);
        
        return '`#' + onChainId + '` total `' + totalText + '`';
    }
    
}

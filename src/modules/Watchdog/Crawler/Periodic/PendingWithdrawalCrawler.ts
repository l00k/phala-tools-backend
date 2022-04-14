import { Utility as PhalaUtility } from '#/Phala';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { Observation, ObservationMode } from '#/Watchdog/Domain/Model/Observation';
import { ObservationType } from '#/Watchdog/Domain/Model/Observation/ObservationNotifications';
import { AbstractCrawler } from '#/Watchdog/Service/PeriodicCrawler/AbstractCrawler';
import { Utility } from '#/Watchdog/Utility/Utility';


export class PendingWithdrawalCrawler
    extends AbstractCrawler
{
    
    protected readonly _messageTitle : string = '🚨 Pending withdrawal(s) in queue';
    protected readonly _observationType : ObservationType = ObservationType.PendingWithdrawals;
    protected readonly _observationMode : ObservationMode = ObservationMode.Owner;
    
    
    protected async _getThresholdPerStakePool (onChainId : number) : Promise<number>
    {
        const onChainStakePool : typeof KhalaTypes.PoolInfo =
            <any>(await this._api.query.phalaStakePool.stakePools(onChainId)).toJSON();
        if (onChainStakePool.withdrawQueue.length == 0) {
            return null;
        }
        
        const totalRaw = onChainStakePool.withdrawQueue.reduce((acc, r) => acc + Number(r.shares), 0);
        return PhalaUtility.parseRawAmount(totalRaw);
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observationValue : number
    ) : string
    {
        const totalText = Utility.formatCoin(observationValue, true);
        
        return '`#' + onChainId + '` total `' + totalText + '`';
    }
    
}

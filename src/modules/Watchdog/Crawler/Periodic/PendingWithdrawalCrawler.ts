import { Utility as PhalaUtility } from '#/Phala';
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
        const stakePoolWrapped = (
            await this._api.query.phalaBasePool.pools(onChainId)
        ).unwrap();
        const stakePool = stakePoolWrapped.asStakePool;
        
        let totalRaw : number = 0;
        
        // todo ld 2023-01-03 14:45:31
        for (const withdrawingNft of stakePool.basepool.withdrawQueue) {
            const nftProps : any[] = <any> (
                await this._api.query.rmrkCore.properties(stakePool.basepool.cid, withdrawingNft.nftId)
            ).toJSON();
            
            const valueProp = nftProps.find(prop => prop[0][2] === 'stake-info');
            
            totalRaw += Number(valueProp[1]);
        }
        
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

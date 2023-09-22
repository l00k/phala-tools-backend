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
    
    
    protected async _getObservedValuePerStakePool (
        onChainId : number
    ) : Promise<[ number, string ]>
    {
        const stakePoolWrapped = (
            await this._api.query.phalaBasePool.pools(onChainId)
        ).unwrap();
        const stakePool = stakePoolWrapped.asStakePool;
        
        if (!stakePool.basepool.withdrawQueue.length) {
            return null;
        }
        
        const poolValueShareCoeff = 1
            / Number(stakePool.basepool.totalShares)
            * Number(stakePool.basepool.totalValue)
            / 1e12;
        
        let totalWithdrawing : number = 0;
        let deadline : number = 1e15;
        
        for (const withdrawingNft of stakePool.basepool.withdrawQueue) {
            const nftShareRaw : string = <any>(
                await this._api.query
                    .rmrkCore.properties(
                        stakePool.basepool.cid,
                        withdrawingNft.nftId,
                        'stake-info'
                    )
            ).toJSON();
            
            const nftShareParsed : any = this._api.createType('NftAttr', nftShareRaw).toJSON();
            totalWithdrawing += Number(nftShareParsed.shares) * poolValueShareCoeff;
            deadline = Math.min(deadline, withdrawingNft.startTime.toNumber());
        }
        
        if (totalWithdrawing == 0) {
            return null;
        }
        
        return [
            totalWithdrawing,
            this._prepareSpecificMessage(onChainId, totalWithdrawing, deadline)
        ];
    }
    
    protected _prepareSpecificMessage (
        onChainId : number,
        observedValue : number,
        deadline : number
    ) : string
    {
        const totalText = Utility.formatCoin(observedValue, true);
        const timeleft = (Date.now() - deadline) / (24 * 3600 * 1000);
        
        return '`#' + onChainId
            + '` total `' + totalText
            + '` timeleft `' + timeleft.toFixed(1) + 'd'
            + '`';
    }
    
}

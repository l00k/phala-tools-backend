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
        const stakePool = stakePoolWrapped?.isStakePool
            ? stakePoolWrapped.asStakePool
            : stakePoolWrapped.asVault
            ;
            
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
            
            const endTime = withdrawingNft.startTime.toNumber() + (7 * 24 * 3600);
            deadline = Math.min(
                deadline,
                endTime
            );
        }
        
        if (totalWithdrawing == 0) {
            return null;
        }
        
        const now = Date.now() / 1000;
        const timeleft = (deadline - now) / (24 * 3600);
        
        return [
            totalWithdrawing,
            this._prepareSpecificMessage(onChainId, totalWithdrawing, timeleft)
        ];
    }
    
    protected _prepareSpecificMessage (
        onChainId : number,
        observedValue : number,
        timeleft : number
    ) : string
    {
        const totalText = Utility.formatCoin(observedValue, true);
        
        return '`#' + onChainId
            + '` total `' + totalText
            + '` timeleft `' + timeleft.toFixed(1) + 'd'
            + '`';
    }
    
}

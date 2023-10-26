import { Utility as PhalaUtility } from '#/Phala/Utility';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { AbstractPeriodicCrawler } from '#/Watchdog/Service/AbstractPeriodicCrawler';
import { Utility } from '#/Watchdog/Utility/Utility';


export class ClaimableRewardsCrawler
    extends AbstractPeriodicCrawler
{
    
    protected readonly _messageTitle : string = '💰 Pending rewards';
    protected readonly _observationType : ObservationType = ObservationType.ClaimableRewards;
    protected readonly _observationMode : ObservationMode = null;
    
    
    protected async _getObservedValuePerObservation (
        onChainId : number,
        observation : Observation
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
        
        let availableRewardsRaw : number = 0;
        
        if (observation.mode === ObservationMode.Owner) {
            if (stakePoolWrapped.isStakePool) {
                const assets = (
                    <any> await this._api.query
                        .assets.account(10000, stakePool.ownerRewardAccount)
                ).unwrapOr(null);
                if (assets) {
                    availableRewardsRaw += Number(assets.balance.toString());
                }
            }
            else {
                // todo
            }
        }
        
        if (availableRewardsRaw === 0) {
            // no rewards or not possible to fetch - skip
            return null;
        }
        
        return [
            PhalaUtility.parseRawAmount(availableRewardsRaw),
            undefined
        ];
    }
    
    protected _prepareGeneralMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number
    ) : string
    {
        let message = '';
        if (observation.account) {
            message += 'Account: `' + Utility.formatAddress(observation.account.address) + '`\n';
        }
        message += 'Stake pool: `#' + onChainId + '`\n'
            + 'Amount: `' + Utility.formatCoin(observedValue, true) + '`\n';
        
        return message;
    }
    
}

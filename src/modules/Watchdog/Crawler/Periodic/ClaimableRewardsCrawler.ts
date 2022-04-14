import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { Utility as PhalaUtility } from '#/Phala/Utility';
import { Observation, ObservationMode } from '#/Watchdog/Domain/Model/Observation';
import { ObservationType } from '#/Watchdog/Domain/Model/Observation/ObservationNotifications';
import { AbstractCrawler } from '#/Watchdog/Service/PeriodicCrawler/AbstractCrawler';
import { Utility } from '#/Watchdog/Utility/Utility';
import { Injectable } from '@inti5/object-manager';


@Injectable({ tag: 'tasker.handler' })
export class ClaimableRewardsCrawler
    extends AbstractCrawler
{
    
    protected readonly _messageTitle : string = '💰 Pending rewards';
    protected readonly _observationType : ObservationType = ObservationType.ClaimableRewards;
    protected readonly _observationMode : ObservationMode = null;
    
    
    protected async _getThresholdPerObservation (
        onChainId : number,
        observation : Observation
    ) : Promise<number>
    {
        const onChainStakePoolRaw : any = await this._api.query.phalaStakePool.stakePools(onChainId);
        const onChainStakePool : typeof KhalaTypes.PoolInfo = onChainStakePoolRaw.toJSON();
        
        let availableRewardsRaw : number = 0;
        
        if (observation.mode === ObservationMode.Owner) {
            availableRewardsRaw += Number(onChainStakePool.ownerReward);
        }
        
        if (observation.account) {
            const onChainStakerRaw : any = await this._api.query.phalaStakePool.poolStakers([
                onChainStakePool.pid,
                observation.account.address
            ]);
            const onChainStaker : typeof KhalaTypes.UserStakeInfo = onChainStakerRaw.toJSON();
            
            if (onChainStaker) {
                availableRewardsRaw += Number(onChainStaker.availableRewards)
                    + Number(onChainStaker.shares) * PhalaUtility.decodeBigNumber(Number(onChainStakePool.rewardAcc))
                    - Number(onChainStaker.rewardDebt);
            }
        }
        
        if (availableRewardsRaw === 0) {
            // no rewards or not possible to fetch - skip
            return null;
        }
        
        return PhalaUtility.parseRawAmount(availableRewardsRaw);
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observationValue : number
    ) : string
    {
        let message = '';
        if (observation.account) {
            message += 'Account: `' + Utility.formatAddress(observation.account.address) + '`\n';
        }
        message += 'Stake pool: `#' + onChainId + '`\n'
            + 'Amount: `' + Utility.formatCoin(observationValue, true) + '`\n';
        
        return message;
    }
    
}

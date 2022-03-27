import { Annotation as API } from 'core/api-backend';


export enum NotificationType
{
    ClaimableRewards = 'claimableRewards',
    RewardsDrop = 'rewardsDrop',
}


@API.Resource('Watchdog/StakePool/Observation/LastNotifications')
export class LastNotifications
{
    
    @API.Property()
    [NotificationType.ClaimableRewards] : number;
    
    @API.Property()
    [NotificationType.RewardsDrop] : number;
    
}

import { Annotation as API } from '@inti5/api-backend';


export enum NotificationType
{
    ClaimableRewards = 'claimableRewards',
    RewardsDrop = 'rewardsDrop',
}


@API.Resource('Watchdog/StakePool/Observation/Notifications')
export class ObservationNotifications
{
    
    @API.Property()
    @API.Groups([
        'Watchdog/User',
    ])
    [NotificationType.ClaimableRewards] : number;
    
    @API.Property()
    @API.Groups([
        'Watchdog/User',
    ])
    [NotificationType.RewardsDrop] : number;
    
}

import { Annotation as API } from '@inti5/api-backend';
import * as Trans from 'class-transformer';


export enum NotificationType
{
    ClaimableRewards = 'claimableRewards',
    RewardsDrop = 'rewardsDrop',
    PoolCommissionChange = 'poolCommissionChange',
    
    UnresponsiveWorker = 'unresponsiveWorker',
    NodeStuck = 'nodeStuck',
    FreePoolFunds = 'freePoolFunds',
    PendingWithdrawals = 'pendingWithdrawals',
}


@API.Resource('Watchdog/StakePool/Observation/Notifications')
export class ObservationNotifications
{
    
    @API.Property()
    @API.Groups([
        'Watchdog/User:*:get',
    ])
    public [NotificationType.ClaimableRewards] : number;
    
    @API.Property()
    @API.Groups([
        'Watchdog/User:*:get',
    ])
    public [NotificationType.RewardsDrop] : number;
    
    @API.Property()
    @API.Groups([
        'Watchdog/User:*:get',
    ])
    public [NotificationType.PoolCommissionChange] : number;
    
    
    @API.Property()
    @API.Groups([
        'Watchdog/User:*:get',
    ])
    public [NotificationType.UnresponsiveWorker] : number;
    
    @API.Property()
    @API.Groups([
        'Watchdog/User:*:get',
    ])
    public [NotificationType.NodeStuck] : number;
    
    @API.Property()
    @API.Groups([
        'Watchdog/User:*:get',
    ])
    public [NotificationType.FreePoolFunds] : number;
    
    @API.Property()
    @API.Groups([
        'Watchdog/User:*:get',
    ])
    public [NotificationType.PendingWithdrawals] : number;
    
    
    public constructor (data? : Partial<ObservationNotifications>)
    {
        Trans.plainToClassFromExist(this, data);
    }
    
}

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
    public [NotificationType.ClaimableRewards] : number;
    
    @API.Property()
    public [NotificationType.RewardsDrop] : number;
    
    @API.Property()
    public [NotificationType.PoolCommissionChange] : number;
    
    
    @API.Property()
    public [NotificationType.UnresponsiveWorker] : number;
    
    @API.Property()
    public [NotificationType.NodeStuck] : number;
    
    @API.Property()
    public [NotificationType.FreePoolFunds] : number;
    
    @API.Property()
    public [NotificationType.PendingWithdrawals] : number;
    
    
    public constructor (data? : Partial<ObservationNotifications>)
    {
        Trans.plainToClassFromExist(this, data);
    }
    
}

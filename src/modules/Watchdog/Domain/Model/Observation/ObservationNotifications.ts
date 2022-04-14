import { Annotation as API } from '@inti5/api-backend';
import * as Trans from 'class-transformer';


export enum ObservationType
{
    ClaimableRewards = 'claimableRewards',
    RewardsDrop = 'rewardsDrop',
    PoolCommissionChange = 'poolCommissionChange',
    
    UnresponsiveWorker = 'unresponsiveWorker',
    NodeStuck = 'nodeStuck',
    FreePoolFunds = 'freePoolFunds',
    PendingWithdrawals = 'pendingWithdrawals',
}


@API.Resource('Watchdog/Observation/Notifications')
export class ObservationNotifications
{
    
    @API.Property()
    public [ObservationType.ClaimableRewards] : number;
    
    @API.Property()
    public [ObservationType.RewardsDrop] : number;
    
    @API.Property()
    public [ObservationType.PoolCommissionChange] : number;
    
    
    @API.Property()
    public [ObservationType.UnresponsiveWorker] : number;
    
    @API.Property()
    public [ObservationType.NodeStuck] : number;
    
    @API.Property()
    public [ObservationType.FreePoolFunds] : number;
    
    @API.Property()
    public [ObservationType.PendingWithdrawals] : number;
    
    
    public constructor (data? : Partial<ObservationNotifications>)
    {
        Trans.plainToClassFromExist(this, data);
    }
    
}

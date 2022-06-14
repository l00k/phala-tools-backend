import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { API } from '@inti5/api-backend';
import * as Trans from 'class-transformer';
import { Assert } from '@inti5/validator/Object';


@API.Resource('Watchdog/Observation/Notifications')
export class ObservationNotifications
{
    
    @API.Property()
    @Assert()
    public [ObservationType.ClaimableRewards] : number;
    
    @API.Property()
    @Assert()
    public [ObservationType.RewardsDrop] : number;
    
    @API.Property()
    @Assert()
    public [ObservationType.PoolCommissionChange] : number;
    
    
    @API.Property()
    @Assert()
    public [ObservationType.UnresponsiveWorker] : number;
    
    @API.Property()
    @Assert()
    public [ObservationType.StuckedNode] : number;
    
    @API.Property()
    @Assert()
    public [ObservationType.FreePoolFunds] : number;
    
    @API.Property()
    @Assert()
    public [ObservationType.PendingWithdrawals] : number;
    
    
    public constructor (data? : Partial<ObservationNotifications>)
    {
        Trans.plainToClassFromExist(this, data);
    }
    
}

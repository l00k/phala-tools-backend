import { NotificationType } from '#/Watchdog/Domain/Model/StakePool/Observation/ObservationNotifications';
import { Annotation as API } from '@inti5/api-backend';
import * as Trans from 'class-transformer';
import { Assert, AssertObject } from '@inti5/validator/Object';


@API.Resource('Watchdog/StakePool/Observation/NotificationConfig')
export class NotificationConfig
{
    
    @API.Property()
    @Assert({
        type: 'boolean'
    })
    public active : boolean;
    
    @API.Property()
    @Assert({
        numericality: {
            onlyInteger: true,
            greaterThan: 0,
        }
    })
    public frequency : number;
    
    @API.Property()
    @Assert({
        numericality: {
            onlyInteger: true,
            greaterThan: 0,
        }
    })
    public threshold : number;
    
    
    public constructor (data? : Partial<NotificationConfig>)
    {
        Trans.plainToClassFromExist(this, data);
    }
    
}


@API.Resource('Watchdog/StakePool/Observation/Configuration')
export class ObservationConfiguration
{
    
    @API.Property(() => NotificationConfig)
    @Assert()
    public [NotificationType.ClaimableRewards] : NotificationConfig = new NotificationConfig({
        active: true,
        frequency: 604800,
        threshold: 100,
    });
    
    @API.Property(() => NotificationConfig)
    @AssertObject({
        threshold: {
            numericality: {
                lessThanOrEqualTo: 100,
            }
        }
    })
    public [NotificationType.RewardsDrop] : NotificationConfig = new NotificationConfig({
        active: true,
        frequency: 86400,
        threshold: 25,
    });
    
    @API.Property(() => NotificationConfig)
    @AssertObject({
        threshold: {
            numericality: {
                lessThanOrEqualTo: 100,
            }
        }
    })
    public [NotificationType.PoolCommissionChange] : NotificationConfig = new NotificationConfig({
        active: true,
        frequency: 86400,
        threshold: 10,
    });
    
    
    @API.Property(() => NotificationConfig)
    @Assert()
    public [NotificationType.UnresponsiveWorker] : NotificationConfig = new NotificationConfig({
        active: true,
        frequency: 3600,
    });
    
    @API.Property(() => NotificationConfig)
    @Assert()
    public [NotificationType.NodeStuck] : NotificationConfig = new NotificationConfig({
        active: true,
        frequency: 3600,
    });
    
    @API.Property(() => NotificationConfig)
    @Assert()
    public [NotificationType.FreePoolFunds] : NotificationConfig = new NotificationConfig({
        active: true,
        frequency: 86400,
        threshold: 10000,
    });
    
    @API.Property(() => NotificationConfig)
    @Assert()
    public [NotificationType.PendingWithdrawals] : NotificationConfig = new NotificationConfig({
        active: true,
        frequency: 86400,
        threshold: 0,
    });
    
    
    public constructor (data? : Partial<ObservationConfiguration>)
    {
        Trans.plainToClassFromExist(this, data);
    }
    
};
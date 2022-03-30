import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { WatchdogAccount } from '#/Watchdog/Domain/Model/WatchdogAccount';
import { WatchdogStakePool } from '#/Watchdog/Domain/Model/WatchdogStakePool';
import { ObservationConfiguration } from '#/Watchdog/Domain/Model/StakePool/Observation/ObservationConfiguration';
import {
    NotificationType,
    ObservationNotifications
} from '#/Watchdog/Domain/Model/StakePool/Observation/ObservationNotifications';
import { User } from '#/Watchdog/Domain/Model/User';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityData } from '@mikro-orm/core/typings';
import { EntityManager } from '@mikro-orm/mysql';
import * as Trans from 'class-transformer';
import { Assert } from '@inti5/validator/Object';



export enum ObservationMode
{
    Owner = 'owner',
    Delegator = 'delegator',
}


@ORM.Entity({
    tableName: 'watchdog_stakepool_observation'
})
@API.Resource('Watchdog/StakePool/Observation')
export class StakePoolObservation
    extends AbstractModel<StakePoolObservation>
{
    
    
    @ORM.PrimaryKey()
    @API.Id()
    @API.Groups([
        'Watchdog/User',
    ])
    public id : number;
    
    
    @ORM.ManyToOne(() => User, { eager: true })
    public user : User;
    
    @ORM.ManyToOne(() => WatchdogStakePool, { eager: true })
    @API.Property(() => WatchdogStakePool)
    @API.Groups([
        'Watchdog/User',
    ])
    public stakePool : WatchdogStakePool;
    
    @ORM.ManyToOne(() => WatchdogAccount, { nullable: true, eager: true })
    @API.Property(() => WatchdogAccount)
    @API.Groups([
        'Watchdog/User',
    ])
    public account : WatchdogAccount;
    
    @ORM.Enum({ items: () => ObservationMode, nullable: true })
    @API.Property()
    @API.Groups([
        'Watchdog/User',
    ])
    @Assert()
    public mode : ObservationMode;
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property(() => ObservationConfiguration)
    @API.Groups([
        'Watchdog/User',
    ])
    public config : ObservationConfiguration = new ObservationConfiguration();
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property(() => ObservationNotifications)
    @API.Groups([
        'Watchdog/User',
    ])
    public lastNotifications : ObservationNotifications = new ObservationNotifications();
    
    
    public constructor (data? : EntityData<StakePoolObservation>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
    public getConfig<K extends keyof ObservationConfiguration> (key : K) : ObservationConfiguration[K]
    {
        if (this.config[key] === undefined) {
            this.config = Trans.plainToClassFromExist(new ObservationConfiguration(), this.config);
        }
        
        return this.config[key];
    }
    
    public getLastNotification (notificationType : NotificationType) : number
    {
        return this.lastNotifications[notificationType];
    }
    
    public updateLastNotification (notificationType : NotificationType)
    {
        this.lastNotifications[notificationType] = Date.now();
    }
    
}

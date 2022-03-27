import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Account } from '#/Watchdog/Domain/Model/Account';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { Configuration } from '#/Watchdog/Domain/Model/StakePool/Observation/Configuration';
import { LastNotifications, NotificationType } from '#/Watchdog/Domain/Model/StakePool/Observation/LastNotifications';
import { User } from '#/Watchdog/Domain/Model/User';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import * as Trans from 'class-transformer';



export enum ObservationMode
{
    Owner = 'owner',
    Delegator = 'delegator',
}


@ORM.Entity({
    tableName: 'watchdog_stakepool_observation'
})
@API.Resource('Watchdog/StakePool/Observation')
export class Observation
    extends AbstractModel<Observation>
{
    
    
    @ORM.PrimaryKey()
    @API.Id()
    @API.Groups([
        'Watchdog/User',
    ])
    public id : number;
    
    
    @ORM.ManyToOne(() => User, { eager: true })
    public user : User;
    
    @ORM.ManyToOne(() => StakePool, { eager: true })
    @API.Property(() => StakePool)
    @API.Groups([
        'Watchdog/User',
    ])
    public stakePool : StakePool;
    
    @ORM.ManyToOne(() => Account, { nullable: true, eager: true })
    @API.Property(() => Account)
    @API.Groups([
        'Watchdog/User',
    ])
    public account : Account;
    
    @ORM.Enum({ items: () => ObservationMode, nullable: true })
    @API.Property()
    @API.Groups([
        'Watchdog/User',
    ])
    public mode : ObservationMode;
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property(() => Configuration)
    @API.Groups([
        'Watchdog/User',
    ])
    public config : Configuration = new Configuration();
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property(() => LastNotifications)
    @API.Groups([
        'Watchdog/User',
    ])
    public lastNotifications : LastNotifications = new LastNotifications();
    
    
    public constructor (data? : Partial<Observation>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
    public getConfig<K extends keyof Configuration> (key : K) : Configuration[K]
    {
        if (this.config[key] === undefined) {
            this.config = Trans.plainToClassFromExist(new Configuration(), this.config);
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

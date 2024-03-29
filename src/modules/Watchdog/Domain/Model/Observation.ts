import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Account, StakePool } from '#/Phala/Domain/Model';
import { ObservationConfiguration } from '#/Watchdog/Domain/Model/Observation/ObservationConfiguration';
import { ObservationNotifications } from '#/Watchdog/Domain/Model/Observation/ObservationNotifications';
import { User } from '#/Watchdog/Domain/Model/User';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { API } from '@inti5/api-backend';
import { Type } from '@inti5/graph-typing';
import { Assert } from '@inti5/validator/Object';
import * as ORM from '@mikro-orm/core';
import type { EntityData } from '@mikro-orm/core/typings';
import * as Trans from 'class-transformer';


@ORM.Entity({
    tableName: 'watchdog_observation'
})
@API.Resource('Watchdog/Observation')
export class Observation
    extends AbstractModel<Observation>
{
    
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    
    @ORM.ManyToOne(() => User, { eager: true })
    public user : User;
    
    @ORM.ManyToOne(() => StakePool, { eager: true })
    @API.Property()
    @Assert()
    @Type(() => StakePool)
    public stakePool : StakePool;
    
    @ORM.ManyToOne(() => Account, { nullable: true, eager: true })
    @API.Property()
    @Assert()
    @Type(() => Account)
    public account : Account;
    
    @ORM.Enum({ items: () => ObservationMode, nullable: true })
    @API.Property()
    public mode : ObservationMode;
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property()
    @Assert()
    @Type(() => ObservationConfiguration)
    public config : ObservationConfiguration = new ObservationConfiguration();
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property()
    @Assert()
    @Type(() => ObservationNotifications)
    public lastNotifications : ObservationNotifications = new ObservationNotifications();
    
    
    public constructor (data? : EntityData<Observation>, entityManager? : ORM.EntityManager)
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
    
    public getLastNotification (observationType : ObservationType) : number
    {
        return this.lastNotifications[observationType];
    }
    
    public updateLastNotification (observationType : ObservationType)
    {
        this.lastNotifications[observationType] = Date.now();
    }
    
}

import { Account } from '#/Watchdog/Domain/Model/Account';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { StakePoolObservationConfiguration } from '#/Watchdog/Domain/Model/StakePoolObservationConfiguration';
import { User } from '#/Watchdog/Domain/Model/User';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { Annotation as API } from '@inti5/api-backend';


export enum NotificationType
{
    ClaimableRewards = 'claimableRewards',
    RewardsDrop = 'rewardsDrop',
}

export enum ObservationMode
{
    Owner = 'owner',
    Delegator = 'delegator',
}


type LastNotifications = {
    [notificationType : string] : number
};


@ORM.Entity({
    tableName: 'watchdog_stakepool_observation'
})
@API.Resource('Watchdog/StakePoolObservation')
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
    @API.Property(() => StakePoolObservationConfiguration)
    @API.Groups([
        'Watchdog/User',
    ])
    public config : StakePoolObservationConfiguration = new StakePoolObservationConfiguration();
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property()
    @API.Groups([
        'Watchdog/User',
    ])
    public lastNotifications : LastNotifications = {};
    
    
    public constructor (data? : Partial<StakePoolObservation>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
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

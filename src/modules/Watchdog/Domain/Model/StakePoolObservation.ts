import { Account } from '#/Watchdog/Domain/Model/Account';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { StakePoolObservationConfiguration } from '#/Watchdog/Domain/Model/StakePoolObservationConfiguration';
import { User } from '#/Watchdog/Domain/Model/User';
import { AbstractModel } from '#/AppBackend/Module/AbstractModel';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


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
export class StakePoolObservation
    extends AbstractModel<StakePoolObservation>
{
    
    
    @ORM.PrimaryKey()
    public id : number;
    
    
    @ORM.ManyToOne(() => User, { eager: true })
    public user : User;
    
    @ORM.ManyToOne(() => StakePool, { eager: true })
    public stakePool : StakePool;
    
    @ORM.ManyToOne(() => Account, { nullable: true, eager: true })
    public account : Account;
    
    @ORM.Enum({ items: () => ObservationMode, nullable: true })
    public mode : ObservationMode;
    
    
    @ORM.Property({ type: ORM.JsonType })
    public config : StakePoolObservationConfiguration = new StakePoolObservationConfiguration();
    
    
    @ORM.Property({ type: ORM.JsonType })
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

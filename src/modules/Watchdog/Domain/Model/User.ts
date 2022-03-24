import { MessagingChannel } from '#/Messaging/Domain/MessagingChannel';
import * as ORM from '@mikro-orm/core';
import { Annotation as API } from '@inti5/api-backend';
import { EntityManager } from '@mikro-orm/mysql';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { StakePoolObservation } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { Account } from '#/Watchdog/Domain/Model/Account';
import { UserConfiguration } from '#/Watchdog/Domain/Model/UserConfiguration';
import * as Trans from 'class-transformer';


@ORM.Entity({
    tableName: 'watchdog_user',
})
@ORM.Unique({ properties: [ 'msgChannel', 'msgUserId' ] })
@API.Resource('Watchdog/User')
export class User
    extends AbstractModel<User>
{

    public static readonly MAX_NODE_COUNT = 3;

    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    
    @ORM.Enum({ items: Object.values(MessagingChannel) })
    @API.Property()
    @API.Groups([
        'Watchdog/User',
    ])
    public msgChannel : MessagingChannel;
    
    @ORM.Property({ index: true })
    public msgUserId : string;
    
    @ORM.Property({ nullable: true })
    public token : string;
    
    @ORM.Property()
    @API.Property()
    @API.Groups([
        'Watchdog/User',
    ])
    public username : string;
    
    
    @ORM.Property({ onCreate: () => new Date() })
    @API.Property()
    @API.Groups([
        'Watchdog/User',
    ])
    public createdAt : Date = new Date();
    
    @ORM.Property({ onUpdate: () => new Date() })
    @API.Property()
    @API.Groups([
        'Watchdog/User',
    ])
    public updatedAt : Date = new Date();
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property()
    @API.Groups([
        'Watchdog/User',
    ])
    public config : UserConfiguration = new UserConfiguration();
    
    @ORM.ManyToMany(() => Account)
    public accounts : ORM.Collection<Account>;
    
    @ORM.OneToMany(() => StakePoolObservation, o => o.user)
    public stakePoolObservations : ORM.Collection<StakePoolObservation>;
    
    
    public constructor (data? : Partial<User>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        
        this.accounts = new ORM.Collection<Account>(this, []);
        this.stakePoolObservations = new ORM.Collection<StakePoolObservation>(this, []);
        
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
    public getConfig <K extends keyof UserConfiguration>(key : K) : UserConfiguration[K]
    {
        if (this.config[key] === undefined) {
            this.config = Trans.plainToClassFromExist(new UserConfiguration(), this.config);
        }
        
        return this.config[key];
    }
    
}

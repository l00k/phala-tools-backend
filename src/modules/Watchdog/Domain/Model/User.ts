import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { MessagingChannel } from '#/Messaging/Domain/MessagingChannel';
import { Account } from '#/Watchdog/Domain/Model/Account';
import { Observation } from '#/Watchdog/Domain/Model/StakePool/Observation';
import { Configuration } from '#/Watchdog/Domain/Model/User/Configuration';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
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
    @API.Property(() => Configuration)
    @API.Groups([
        'Watchdog/User',
    ])
    public config : Configuration = new Configuration();
    
    @ORM.ManyToMany(() => Account)
    public accounts : ORM.Collection<Account>;
    
    @ORM.OneToMany(() => Observation, o => o.user)
    @API.Property(() => Observation)
    @API.Groups([
        'Watchdog/User',
    ])
    public stakePoolObservations : ORM.Collection<Observation>;
    
    
    public constructor (data? : Partial<User>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        
        this.accounts = new ORM.Collection<Account>(this, []);
        this.stakePoolObservations = new ORM.Collection<Observation>(this, []);
        
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
    
}

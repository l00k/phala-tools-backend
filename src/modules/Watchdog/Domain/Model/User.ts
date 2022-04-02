import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { MessagingChannel } from '#/Messaging/Domain/MessagingChannel';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { UserConfiguration } from '#/Watchdog/Domain/Model/UserConfiguration';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityData } from '@mikro-orm/core/typings';
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
    public msgChannel : MessagingChannel;
    
    @ORM.Property({ index: true })
    public msgUserId : string;
    
    @ORM.Property({ nullable: true })
    public token : string;
    
    @ORM.Property()
    @API.Property()
    public username : string;
    
    
    @ORM.Property({ onCreate: () => new Date() })
    public createdAt : Date = new Date();
    
    @ORM.Property({ onUpdate: () => new Date() })
    public updatedAt : Date = new Date();
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property(() => UserConfiguration)
    public config : UserConfiguration = new UserConfiguration();
    
    @ORM.OneToMany(() => Observation, o => o.user)
    @API.Property(() => [ Observation ])
    public stakePoolObservations : ORM.Collection<Observation>;
    
    
    public constructor (data? : EntityData<User>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        
        this.stakePoolObservations = new ORM.Collection<Observation>(this, []);
        
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
    public getConfig<K extends keyof UserConfiguration> (key : K) : UserConfiguration[K]
    {
        if (this.config[key] === undefined) {
            this.config = Trans.plainToClassFromExist(new UserConfiguration(), this.config);
        }
        
        return this.config[key];
    }
    
}

import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


@ORM.Entity({
    tableName: 'watchdog_account'
})
@API.Resource('Watchdog/Account')
export class Account
    extends AbstractModel<Account>
{
    
    @ORM.PrimaryKey()
    @API.Id()
    @API.Groups([
        'Watchdog/Account',
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    public id : number;
    
    
    @ORM.Property({ unique: true })
    @API.Property()
    @API.Groups([
        'Watchdog/Account',
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    @API.Filterable()
    public address : string;
    
    @ORM.Property({ nullable: true })
    @API.Property()
    @API.Groups([
        'Watchdog/Account',
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    @API.Filterable()
    public identity : string;
    
    
    
    @ORM.Property({ onCreate: () => new Date() })
    public createdAt : Date = new Date();
    
    @ORM.Property({ onUpdate: () => new Date() })
    public updatedAt : Date = new Date();
    
    
    public constructor (data? : Partial<Account>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

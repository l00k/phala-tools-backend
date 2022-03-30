import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


@ORM.Entity({
    tableName: 'stats_account'
})
@API.Resource('Stats/Account')
export class Account
    extends AbstractModel<Account>
{
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    @ORM.Property({ unique: true })
    @API.Property()
    @API.Groups([
        'Stats/Account',
        'Stats/StakePool'
    ])
    @API.Filterable()
    public address : string;
    
    @ORM.Property({ nullable: true })
    @API.Property()
    @API.Groups([
        'Stats/Account',
        'Stats/StakePool'
    ])
    @API.Filterable()
    public identity : string;
    
    @ORM.Property()
    @API.Property()
    @API.Groups([
        'Stats/Account',
        'Stats/StakePool'
    ])
    @API.Filterable()
    @API.Sortable()
    public identityVerified : boolean = false;
    
    
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

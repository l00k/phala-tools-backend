import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ORM from '@mikro-orm/core';
import { API } from '@inti5/api-backend';
import { Assert } from '@inti5/validator/Object';


@ORM.Entity({
    tableName: 'phala_account'
})
@API.Resource('Account')
export class Account
    extends AbstractModel<Account>
{
    
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    
    @ORM.Property({ unique: true })
    @API.Property()
    @API.Filterable()
    public address : string;
    
    @ORM.Property({ nullable: true })
    @API.Property()
    @API.Filterable()
    public identity : string;
    
    @ORM.Property()
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public identityVerified : boolean = false;
    
    
    @ORM.Property({ onCreate: () => new Date() })
    public createdAt : Date = new Date();
    
    @ORM.Property({ onUpdate: () => new Date() })
    public updatedAt : Date = new Date();
    
    
    public constructor (data? : Partial<Account>, entityManager? : ORM.EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

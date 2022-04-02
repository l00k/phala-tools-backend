import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { Annotation as API } from '@inti5/api-backend';



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
    public address : string;
    
    @ORM.Property({ nullable: true })
    @API.Property()
    public identity : string;
    
    @ORM.Property()
    @API.Property()
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

import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Account } from '#/Phala/Domain/Model/Account';
import * as ORM from '@mikro-orm/core';
import { API } from '@inti5/api-backend';
import { Assert } from '@inti5/validator/Object';
import { Type } from '@inti5/graph-typing';



@ORM.Entity({
    tableName: 'phala_stakepool'
})
@API.Resource('StakePool')
export class StakePool
    extends AbstractModel<StakePool>
{
    
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    
    @ORM.Property({ unique: true, nullable: true })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    @Assert()
    public onChainId : number;
    
    @ORM.ManyToOne(() => Account)
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    @Assert({})
    @Type(() => Account)
    public owner : Account;
    
    
    @ORM.Property({ onCreate: () => new Date() })
    public createdAt : Date = new Date();
    
    @ORM.Property({ onUpdate: () => new Date() })
    public updatedAt : Date = new Date();
    
    
    public constructor (data? : Partial<StakePool>, entityManager? : ORM.EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

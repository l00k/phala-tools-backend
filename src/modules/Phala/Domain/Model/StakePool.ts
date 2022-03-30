import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Account } from '#/Phala/Domain/Model/Account';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { Annotation as API } from 'core/api-backend';



@ORM.Entity({
    tableName: 'phala_stakepool',
    discriminatorColumn: 'discr'
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
    @API.Groups([
        'StakePool',
    ])
    public onChainId : number;
    
    @ORM.ManyToOne(() => Account)
    @API.Property(() => Account)
    @API.Groups([
        'StakePool',
    ])
    public owner : Account;
    
    
    @ORM.Property({ onCreate: () => new Date() })
    public createdAt : Date = new Date();
    
    @ORM.Property({ onUpdate: () => new Date() })
    public updatedAt : Date = new Date();
    
    
    public constructor (data? : Partial<StakePool>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

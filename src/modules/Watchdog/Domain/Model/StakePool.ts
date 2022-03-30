import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Account } from '#/Watchdog/Domain/Model/Account';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


@ORM.Entity({
    tableName: 'watchdog_stakepool'
})
@API.Resource('Watchdog/StakePool')
export class StakePool
    extends AbstractModel<StakePool>
{
    
    
    @ORM.PrimaryKey()
    @API.Id()
    @API.Groups([
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    public id : number;
    
    
    @ORM.Property({ nullable: true })
    @API.Property()
    @API.Groups([
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    @API.Filterable()
    public onChainId : number;
    
    @ORM.ManyToOne(() => Account)
    @API.Property(() => Account)
    @API.Groups([
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    @API.Filterable()
    public owner : Account;
    
    
    public constructor (data? : Partial<StakePool>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

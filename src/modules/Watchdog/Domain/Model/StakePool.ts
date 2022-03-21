import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AbstractModel } from '@inti5/app-backend/Module/AbstractModel';
import { Account } from '#/Watchdog/Domain/Model/Account';



@ORM.Entity({
    tableName: 'watchdog_stakepool'
})
export class StakePool
    extends AbstractModel<StakePool>
{


    @ORM.PrimaryKey()
    public id : number;


    @ORM.Property()
    public onChainId : number;

    @ORM.ManyToOne(() => Account)
    public owner : Account;


    public constructor (data? : Partial<StakePool>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}

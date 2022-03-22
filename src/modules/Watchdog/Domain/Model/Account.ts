import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AbstractModel } from '#/AppBackend/Module/AbstractModel';



@ORM.Entity({
    tableName: 'watchdog_account'
})
export class Account
    extends AbstractModel<Account>
{
    
    
    @ORM.PrimaryKey()
    public id : number;
    
    
    @ORM.Property({ unique: true })
    public address : string;
    
    
    public constructor (data? : Partial<Account>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

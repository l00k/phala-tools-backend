import { Inject, Singleton } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, MySqlDriver } from '@mikro-orm/mysql';


type TransactionCallback = (entityManager : EntityManager) => Promise<void>;


@Singleton()
export class EntityManagerWrapper
{
    
    @Inject({ ctorArgs: [ EntityManagerWrapper.name ] })
    protected logger : Logger;
    
    @Inject({ name: 'orm' })
    protected orm : MikroORM<MySqlDriver>;
    
    
    public getDirectEntityManager () : EntityManager
    {
        return this.orm.em.fork(true);
    }
    
    public async transaction (callback : TransactionCallback) : Promise<void>
    {
        const txEntityManager = this.orm.em.fork(true);
        
        return new Promise(async(resolve, reject) => {
            try {
                await txEntityManager.begin();
                await callback(txEntityManager);
                await txEntityManager.commit();
                
                resolve();
            }
            catch (e) {
                await txEntityManager.rollback();
                reject(e);
            }
        });
    }
    
}

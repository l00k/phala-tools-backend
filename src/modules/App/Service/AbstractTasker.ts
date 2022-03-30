import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { Inject, ObjectManager } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { EntityManager } from '@mikro-orm/mysql';



type Mapped<T> = { [key : string | number] : T };


export abstract class AbstractTasker
{
    
    protected _logger : Logger;
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    protected _entityManager : EntityManager;
    protected _txEntityManager : EntityManager;
    
    
    public async run () : Promise<any>
    {
        await this._init();
        await this._process();
    }
    
    protected async _init () : Promise<any>
    {
        this._logger = ObjectManager.getSingleton().getInstance(Logger, [ this.constructor.name ]);
        this._entityManager = this._entityManagerWrapper.getDirectEntityManager();
    }
    
    protected abstract _process () : Promise<any>;
    
}

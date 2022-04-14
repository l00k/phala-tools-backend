import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { AbstractHandler } from '#/BackendCore/Service/Tasker/AbstractHandler';
import { ApiProvider } from '#/Phala';
import { ApiMode } from '#/Polkadot';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiPromise } from '@polkadot/api';
import { InitializeSymbol, Inject } from 'core/object-manager';
import { Logger } from 'core/utils/Logger';


export type ThresholdCallback = (observation : Observation) => Promise<number>;
export type MessageCallback = (observation : Observation, value : number) => string;


export abstract class AbstractCrawler
    extends AbstractHandler
{
    
    @Inject()
    protected _logger : Logger;
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _apiProvider : ApiProvider;
    
    protected _entityManager : EntityManager;
    
    protected _api : ApiPromise;
    
    
    public [InitializeSymbol] ()
    {
        this._logger.setServiceName(this.constructor.name);
    }
    
    public async run () : Promise<boolean>
    {
        await this._init();
        const result = await this._process();
        await this._postProcess();
        
        return result;
    }
    
    protected async _init ()
    {
        this._entityManager = this._entityManagerWrapper.getCleanEntityManager();
        this._api = await this._apiProvider.getApi(ApiMode.WS);
    }
    
    protected abstract _process () : Promise<boolean>;
    
    protected async _postProcess ()
    {
        await this._entityManager.flush();
    }
    
}

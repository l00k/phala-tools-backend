import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { AbstractHandler } from '#/BackendCore/Service/Tasker/AbstractHandler';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { MessagingProvider } from '#/Messaging/Service/MessagingProvider';
import { ApiProvider } from '#/Phala/Service/ApiProvider';
import { AbstractIssue } from '#/Watchdog/Domain/Model/AbstractIssue';
import { InitializeSymbol, Inject, ObjectManager } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { EntityRepository } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiPromise } from '@polkadot/api';


export abstract class AbstractReminderHandler
    extends AbstractHandler
{
    
    protected static readonly ISSUE_CLASS : typeof AbstractIssue;
    
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _apiProvider : ApiProvider;
    
    @Inject()
    protected _messagingProvider : MessagingProvider;
    
    
    protected _logger : Logger;
    
    protected _notificationAggregator : NotificationAggregator;
    
    protected _api : ApiPromise;
    
    protected _entityManager : EntityManager;
    
    
    
    public [InitializeSymbol] ()
    {
        const Constructor : typeof AbstractReminderHandler = <any>this.constructor;
        
        this._logger = ObjectManager.getSingleton()
            .getInstance(Logger, [ Constructor.name ]);
    }
    
    public async init ()
    {
        this._api = await this._apiProvider.getApi();
        this._entityManager = this._entityManagerWrapper.getDirectEntityManager();
    }
    
    public async postProcess ()
    {
        await this._notificationAggregator.send();
        await this._entityManager.flush();
    }
    
    protected async _loadIssues<T extends AbstractIssue<T>> () : Promise<T[]>
    {
        const Constructor : typeof AbstractReminderHandler = <any>this.constructor;
        
        const issueRepository : EntityRepository<any> = <any>this._entityManager.getRepository(Constructor.ISSUE_CLASS);
        return issueRepository.findAll();
    }
    
}

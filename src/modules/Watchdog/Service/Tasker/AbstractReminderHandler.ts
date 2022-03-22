import { EntityManagerWrapper } from '#/AppBackend/Service/EntityManagerWrapper';
import { AbstractHandler } from '#/AppBackend/Service/Tasker/AbstractHandler';
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
    protected entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected apiProvider : ApiProvider;
    
    @Inject()
    protected messagingProvider : MessagingProvider;
    
    
    protected logger : Logger;
    
    protected notificationAggregator : NotificationAggregator;
    
    protected api : ApiPromise;
    
    protected entityManager : EntityManager;
    
    
    
    public [InitializeSymbol] ()
    {
        const Constructor : typeof AbstractReminderHandler = <any>this.constructor;
        
        this.logger = ObjectManager.getSingleton()
            .getInstance(Logger, [ Constructor.name ]);
    }
    
    public async init ()
    {
        this.api = await this.apiProvider.getApi();
        this.entityManager = this.entityManagerWrapper.getDirectEntityManager();
    }
    
    public async postProcess ()
    {
        await this.notificationAggregator.send();
        await this.entityManager.flush();
    }
    
    protected async loadIssues<T extends AbstractIssue<T>> () : Promise<T[]>
    {
        const Constructor : typeof AbstractReminderHandler = <any>this.constructor;
        
        const issueRepository : EntityRepository<any> = <any>this.entityManager.getRepository(Constructor.ISSUE_CLASS);
        return issueRepository.findAll();
    }
    
}

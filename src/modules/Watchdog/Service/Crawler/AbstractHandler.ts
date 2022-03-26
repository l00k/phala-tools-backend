import { Event } from '#/Watchdog/Service/Crawler/Event';
import { InitializeSymbol, Inject, ObjectManager } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { EntityManager } from '@mikro-orm/mysql';
import { ListenSymbol } from '#/Watchdog/Service/Crawler/def';
import { ApiProvider } from '#/Phala/Service/ApiProvider';
import { ApiPromise } from '@polkadot/api';
import { MessagingProvider } from '#/Messaging/Service/MessagingProvider';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import colors from 'colors';


export abstract class AbstractHandler
{

    protected static readonly [ListenSymbol] : {
        [eventType : string] : string[]
    };


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
        const Constructor : typeof AbstractHandler = <any>this.constructor;

        this._logger = ObjectManager.getSingleton()
            .getInstance(Logger, [ Constructor.name ]);
    }

    public async init ()
    {
        this._api = await this._apiProvider.getApi();
    }

    public canHandle (event : Event) : boolean
    {
        const Prototype : typeof AbstractHandler = Object.getPrototypeOf(this);

        const methods = Prototype[ListenSymbol][event.type];
        if (!methods) {
            return false;
        }

        return true;
    }

    public beforeHandle (entityManaer : EntityManager)
    {
        this._entityManager = entityManaer;
    }

    public async tryHandle (event : Event) : Promise<boolean>
    {
        const Prototype : typeof AbstractHandler = Object.getPrototypeOf(this);

        const methods = Prototype[ListenSymbol][event.type];
        if (!methods) {
            return false;
        }

        let handled = false;

        try {
            for (const method of methods) {
                const onceHandled = await this[method](event);
                if (onceHandled) {
                    handled = true;
                }
            }
        }
        catch (e) {
            this._logger.error(e);
            return false;
        }

        return handled;
    }

    public async chunkPostProcess ()
    {
        if (this._notificationAggregator) {
            await this._notificationAggregator.send();
        }
    }

}

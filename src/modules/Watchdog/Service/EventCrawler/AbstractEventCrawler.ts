import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { ApiProvider } from '#/Phala/Service/ApiProvider';
import { ApiMode } from '#/Polkadot';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { ListenSymbol } from '#/Watchdog/Service/EventCrawler/def';
import { Event } from '#/Watchdog/Service/EventCrawler/Event';
import { InitializeSymbol, Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiPromise } from '@polkadot/api';
import groupBy from 'lodash/groupBy';
import * as ORM from '@mikro-orm/core';


export abstract class AbstractEventCrawler
{
    
    protected static readonly [ListenSymbol] : {
        [eventType : string] : string[]
    };
    
    
    @Inject()
    protected _logger : Logger;
    
    @Inject()
    protected _notificationAggregator : NotificationAggregator;
    
    @Inject()
    protected _apiProvider : ApiProvider;
    
    protected _entityManager : EntityManager;
    
    protected _api : ApiPromise;
    
    
    protected readonly _messageTitle : string;
    protected readonly _observationType : ObservationType;
    protected readonly _observationMode : ObservationMode;
    
    
    public [InitializeSymbol] ()
    {
        this._logger.setServiceName(this.constructor.name);
    }
    
    public async init ()
    {
        this._notificationAggregator.setTitle(this._messageTitle);
        this._api = await this._apiProvider.getApi(ApiMode.WS);
    }
    
    public async tryHandle (
        event : Event,
        entityManager : EntityManager,
    ) : Promise<boolean>
    {
        const Prototype : typeof AbstractEventCrawler = Object.getPrototypeOf(this);
        
        const methods = Prototype[ListenSymbol][event.type];
        if (!methods) {
            return false;
        }
        
        // bind entity manager
        this._entityManager = entityManager;
        
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
    
    public async postProcess ()
    {
        await this._notificationAggregator.send();
    }
    
    
    protected async _processObservations (
        onChainId : number,
        observedValue : number,
        additionalData : any = null
    ) : Promise<boolean>
    {
        const observations = await this._fetchObservations();
        if (!observations.length) {
            return false;
        }
        
        this._logger.log(`${observations.length} active observations found`);
        
        const observationGroups = groupBy(observations, obs => obs.stakePool.onChainId);
        
        for (const [ onChainIdStr, observations ] of Object.entries(observationGroups)) {
            const onChainId : number = Number(onChainIdStr);
            
            this._logger.debug('StakePool', onChainId);
            
            for (const observation of observations) {
                this._logger.debug('Observation', observation.id);
                
                const deltaTime : number = (Date.now() - observation.lastNotifications[this._observationType]) / 1000;
                if (deltaTime < observation.config[this._observationType].frequency) {
                    // too frequent - skip
                    this._logger.debug('Too frequent');
                    continue;
                }
                
                const threshold = observation.config[this._observationType].threshold;
                if (observedValue < threshold) {
                    // below threshold - skip
                    this._logger.debug(`Value ${observedValue.toFixed(2)} below threshold ${threshold.toFixed(2)}`);
                    continue;
                }
                
                const message = this._prepareMessage(
                    onChainId,
                    observation,
                    observedValue,
                    additionalData
                );
                
                this._notificationAggregator.aggregate(
                    observation.user.msgChannel,
                    observation.user.msgUserId,
                    message
                );
                
                // update last notification time
                observation.lastNotifications[this._observationType] = Date.now();
            }
        }
        
        return true;
    }
    
    protected async _fetchObservations () : Promise<Observation[]>
    {
        const observationRepository = this._entityManager.getRepository(Observation);
        
        const filters : ORM.FilterQuery<Observation> = {
            config: {
                [this._observationType]: {
                    active: true,
                }
            }
        };
        
        if (this._observationMode) {
            filters.mode = this._observationMode;
        }
        
        return await observationRepository.find(filters);
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number,
        additionalData : any = null
    ) : string
    {
        return '';
    }
    
}

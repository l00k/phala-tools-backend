import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { AbstractHandler } from '#/BackendCore/Service/Tasker/AbstractHandler';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { ApiProvider } from '#/Phala';
import { ApiMode } from '#/Polkadot';
import { Observation, ObservationMode } from '#/Watchdog/Domain/Model/Observation';
import { ObservationType } from '#/Watchdog/Domain/Model/Observation/ObservationNotifications';
import { InitializeSymbol, Inject, ObjectManager } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiPromise } from '@polkadot/api';
import groupBy from 'lodash/groupBy';


export type ThresholdCallback = (observation : Observation) => Promise<number>;
export type MessageCallback = (observation : Observation, value : number) => string;


export abstract class AbstractCrawler
    extends AbstractHandler
{
    
    protected readonly _messageTitle : string;
    protected readonly _observationType : ObservationType;
    protected readonly _observationMode : ObservationMode;
    
    
    protected _logger : Logger;
    
    protected _notificationAggregator : NotificationAggregator;
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _apiProvider : ApiProvider;
    
    protected _entityManager : EntityManager;
    
    protected _api : ApiPromise;
    
    
    public [InitializeSymbol] ()
    {
        const Constructor : typeof AbstractCrawler = <any>this.constructor;
        
        const objectManager = ObjectManager.getSingleton();
        this._logger = objectManager.getInstance(Logger, [ Constructor.name ]);
        this._notificationAggregator = objectManager.getInstance(NotificationAggregator);
    }
    
    public async run () : Promise<boolean>
    {
        await this._init();
        const result = await this._handle();
        await this._postProcess();
        
        return result;
    }
    
    protected async _handle () : Promise<boolean>
    {
        const observations = await this._fetchObservations();
        if (!observations.length) {
            return false;
        }
        
        this._logger.log(`${observations.length} active observations found`);
        
        const observationGroups = groupBy(observations, obs => obs.stakePool.onChainId);
        
        for (const [ onChainId, observations ] of Object.entries(observationGroups)) {
            this._logger.debug('StakePool', onChainId);
        
            for (const observation of observations) {
                this._logger.debug('Observation', observation.id);
                
                const deltaTime : number = (Date.now() - observation.lastNotifications[this._observationType]) / 1000;
                if (deltaTime < observation.config[this._observationType].frequency) {
                    // too frequent - skip
                    this._logger.debug('Too frequent');
                    continue;
                }
                
                let observationValue : number = await this._getThresholdPerObservation(
                    Number(onChainId),
                    observation
                );
                if (observationValue === null) {
                    observationValue = await this._getThresholdPerStakePool(Number(onChainId));
                }
                if (observationValue === null) {
                    // skip
                    this._logger.debug(`Undefined value`);
                    continue;
                }
                
                const threshold = observation.config[this._observationType].threshold;
                if (observationValue < threshold) {
                    // below threshold - skip
                    this._logger.debug(`Value ${observationValue.toFixed(2)} below threshold ${threshold.toFixed(2)}`);
                    continue;
                }
                
                const message = this._prepareMessage(
                    Number(onChainId),
                    observation,
                    observationValue
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
    
    protected async _init ()
    {
        this._notificationAggregator.setTitle(this._messageTitle);
        this._entityManager = this._entityManagerWrapper.getCommonEntityManager();
        this._api = await this._apiProvider.getApi(ApiMode.WS);
    }
    
    protected async _postProcess ()
    {
        await this._notificationAggregator.send();
        await this._entityManager.flush();
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
    
    protected async _getThresholdPerStakePool (onChainId : number) : Promise<number>
    {
        return null;
    }
    
    protected async _getThresholdPerObservation (
        onChainId : number,
        observation : Observation
    ) : Promise<number>
    {
        return null;
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observationValue : number
    ) : string
    {
        return '';
    }
    
}

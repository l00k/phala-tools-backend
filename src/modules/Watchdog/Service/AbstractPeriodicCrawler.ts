import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { AbstractHandler } from '#/BackendCore/Service/Tasker/AbstractHandler';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { ApiProvider } from '#/Phala';
import { ApiMode } from '#/Polkadot';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiPromise } from '@polkadot/api';
import { InitializeSymbol, Inject, ObjectManager } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import groupBy from 'lodash/groupBy';


export type ThresholdCallback = (observation : Observation) => Promise<number>;
export type MessageCallback = (observation : Observation, value : number) => string;


export abstract class AbstractPeriodicCrawler
    extends AbstractHandler
{
    
    protected readonly _messageTitle : string;
    protected readonly _observationType : ObservationType;
    protected readonly _observationMode : ObservationMode;
    
    
    @Inject()
    protected _logger : Logger;
    
    @Inject()
    protected _notificationAggregator : NotificationAggregator;
    
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
        const result = await this._handle();
        await this._postProcess();
        
        return result;
    }
    
    protected async _init ()
    {
        this._notificationAggregator.setTitle(this._messageTitle);
        this._entityManager = this._entityManagerWrapper.getCleanEntityManager();
        this._api = await this._apiProvider.getApi(ApiMode.WS);
    }
    
    protected async _handle () : Promise<boolean>
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
                
                let observedValue : number = await this._getObservedValuePerObservation(
                    onChainId,
                    observation
                );
                if (observedValue === null) {
                    observedValue = await this._getObservedValuePerStakePool(onChainId);
                }
                if (observedValue === null) {
                    // skip
                    this._logger.debug(`Undefined value`);
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
                    observedValue
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
    
    protected async _getObservedValuePerStakePool (onChainId : number) : Promise<number>
    {
        return null;
    }
    
    protected async _getObservedValuePerObservation (
        onChainId : number,
        observation : Observation
    ) : Promise<number>
    {
        return null;
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number
    ) : string
    {
        return '';
    }
    
}

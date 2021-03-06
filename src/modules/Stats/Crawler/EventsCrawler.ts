import { AppState } from '#/BackendCore/Domain/Model/AppState';
import * as Phala from '#/Phala';
import { KhalaTypes } from '#/Phala';
import * as Polkadot from '#/Polkadot';
import { EventsCrawlerState } from '#/Stats/Domain/Model/AppState/EventsCrawlerState';
import * as Events from '#/Stats/Domain/Model/Event';
import { Event, EventType } from '#/Stats/Domain/Model/Event';
import { AbstractCrawler } from '#/Stats/Service/AbstractCrawler';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { encodeAddress } from '@polkadot/util-crypto';


export class EventsCrawler
    extends AbstractCrawler
{
    
    protected static readonly PHALA_SS58FORMAT = 30;
    
    
    @Inject({ ctorArgs: [ EventsCrawler.name ] })
    protected _logger : Logger;
    
    @Inject()
    protected _phalaSubscan : Phala.Subscan;
    
    protected _appStateClass : any = EventsCrawlerState;
    protected _appState : AppState<EventsCrawlerState>;
    
    
    protected async _process ()
    {
        // pool creation
        this._logger.info(`Pool creation`);
        
        await this._processEvents(
            EventType.PoolCreated,
            'phalastakepool', 'poolcreated',
            400000,
            async(event : Event<Events.PoolCreated>, params : any[]) => {
                const onChainId = Number(params[1]);
                event.stakePoolEntry = await this._getOrCreateStakePool(onChainId);
                
                event.stakePoolEntry.createdAt = event.blockDate;
            }
        );
        
        await this._entityManager.flush();
        
        // commission change
        this._logger.info(`Commission change events`);
        
        await this._processEvents(
            EventType.CommissionChange,
            'phalastakepool', 'poolcommissionset',
            100000,
            async(event : Event<Events.CommissionChange>, params : any[]) => {
                const onChainId = Number(params[0]);
                const newCommission = Polkadot.Utility.parseRawPercent(Number(params[1]));
                
                // calcualate delta
                const previousBlockHash = await this._phalaApi.rpc.chain.getBlockHash(event.blockNumber - 1);
                const onChainStakePoolRaw = await this._phalaApi.query
                    .phalaStakePool.stakePools
                    .at(previousBlockHash, onChainId);
                const onChainStakePool : typeof KhalaTypes.PoolInfo = <any>onChainStakePoolRaw.toJSON();
                
                const commissionDelta = newCommission - Polkadot.Utility.parseRawPercent(onChainStakePool.payoutCommission);
                
                event.stakePoolEntry = await this._getOrCreateStakePool(onChainId);
                event.additionalData = {
                    commission: newCommission,
                    delta: commissionDelta,
                };
            }
        );
        
        // contributions
        this._logger.info(`Contribution events`);
        
        await this._processEvents(
            EventType.Contribution,
            'phalastakepool', 'contribution',
            50000,
            async(event : Event<Events.Contribution>, params : any[]) => {
                event.stakePoolEntry = await this._getOrCreateStakePool(Number(params[0]));
                
                const hexAddr = (params[1].substring(0, 2) == '0x' ? '' : '0x') + params[1];
                const address = encodeAddress(hexAddr, EventsCrawler.PHALA_SS58FORMAT);
                event.sourceAccount = await this._getOrCreateAccount(address);
                
                event.amount = Phala.Utility.parseRawAmount(Number(params[2]));
            }
        );
        
        // withdrawals
        this._logger.info(`Widthdrawals events`);
        
        await this._processEvents(
            EventType.Withdrawal,
            'phalastakepool', 'withdrawal',
            50000,
            async(event : Event<Events.Withdrawal>, params : any[]) => {
                event.stakePoolEntry = await this._getOrCreateStakePool(Number(params[0]));
                
                const hexAddr = (params[1].substring(0, 2) == '0x' ? '' : '0x') + params[1];
                const address = encodeAddress(hexAddr, EventsCrawler.PHALA_SS58FORMAT);
                event.sourceAccount = await this._getOrCreateAccount(address);
                
                event.amount = Phala.Utility.parseRawAmount(Number(params[2]));
            }
        );
        
        // slashes
        this._logger.info(`Slash events`);
        
        await this._processEvents(
            EventType.Slash,
            'phalastakepool', 'poolslashed',
            50000,
            async(event : Event<Events.Slash>, params : any[]) => {
                event.stakePoolEntry = await this._getOrCreateStakePool(Number(params[0]));
                
                event.amount = Phala.Utility.parseRawAmount(Number(params[1]));
            }
        );
        
        // slashes
        this._logger.info(`Halving events`);
        
        await this._processEvents(
            EventType.Halving,
            'phalamining', 'subsidybudgethalved',
            400000,
            async() => {}
        );
    }
    
    protected async _processEvents<T> (
        eventType : EventType,
        module : string,
        call : string,
        chunkSize : number,
        callback : (event : Event<T>, params : any[]) => Promise<void>
    )
    {
        if (this._appState.value[eventType] === undefined) {
            this._appState.value = {
                ...(new EventsCrawlerState()),
                ...this._appState.value
            };
        }
        
        while (true) {
            if (this._appState.value[eventType] >= this._finalizedBlockNumber) {
                break;
            }
            
            const firstBlock : number = this._appState.value[eventType];
            const lastBlock : number = Math.min(
                firstBlock + chunkSize - 1,
                this._finalizedBlockNumber
            );
            
            this._logger.log(`Next chunk`, firstBlock, lastBlock);
            
            try {
                await this._entityManagerWrapper.transaction(async(entityManager) => {
                    this._txEntityManager = entityManager;
                    
                    await this._processEventsChunk(
                        eventType,
                        firstBlock, lastBlock,
                        module, call,
                        callback
                    );
                    
                    await entityManager.flush();
                });
                
                // update app state
                this._appState.value[eventType] = lastBlock + 1;
                
                await this._entityManager.flush();
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    
    protected async _processEventsChunk<T> (
        eventType : EventType,
        firstBlock : number,
        lastBlock : number,
        module : string,
        call : string,
        callback : (event : Event<T>, params : any[]) => Promise<void>
    )
    {
        const eventsGen = this._phalaSubscan.getEvents({
            block_range: `${firstBlock}-${lastBlock}`,
            module,
            call,
        });
        
        for await (const events of eventsGen) {
            for (const eventData of events) {
                const event = new Event<T>({
                    blockNumber: eventData.block_num,
                    blockDate: new Date(eventData.block_timestamp * 1000),
                    type: eventType,
                }, this._txEntityManager);
                
                await callback(event, eventData.params);
                
                this._txEntityManager.persist(event);
            }
        }
    }
    
}

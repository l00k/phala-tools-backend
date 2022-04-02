import { AppState } from '#/BackendCore/Domain/Model/AppState';
import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import * as Phala from '#/Phala';
import { KhalaTypes } from '#/Phala';
import * as Polkadot from '#/Polkadot';
import { OnChainEventsCrawlerState } from '#/Stats/Domain/Model/AppState/OnChainEventsCrawlerState';
import * as Events from '#/Stats/Domain/Model/Event';
import { Event, EventType } from '#/Stats/Domain/Model/Event';
import { AbstractCrawler } from '#/Stats/Service/AbstractCrawler';
import { Inject, Injectable } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { Timeout } from '@inti5/utils/Timeout';
import { encodeAddress } from '@polkadot/util-crypto';


@Injectable({ tag: 'tasker.handler' })
export class OnChainEventsCrawler
    extends AbstractCrawler
{
    
    protected static readonly PHALA_SS58FORMAT = 30;
    
    
    @Inject({ ctorArgs: [ OnChainEventsCrawler.name ] })
    protected logger : Logger;
    
    @Inject()
    protected phalaSubscan : Phala.Subscan;
    
    protected appStateClass : any = OnChainEventsCrawlerState;
    protected appState : AppState<OnChainEventsCrawlerState>;
    
    
    @Task({
        cronExpr: '*/30 * * * *'
    })
    @Timeout(5 * 60 * 1000)
    public async run ()
    {
        return super.run();
    }
    
    
    protected async _process ()
    {
        // pool creation
        this.logger.info(`Pool creation`);
        
        await this.processEvents(
            EventType.PoolCreated,
            'phalastakepool', 'poolcreated',
            400000,
            async(event : Event<Events.PoolCreated>, params : any[]) => {
                const onChainId = Number(params[1]);
                event.stakePoolEntry = await this.getOrCreateStakePool(onChainId);
                
                event.stakePoolEntry.createdAt = event.blockDate;
            }
        );
        
        await this._entityManager.flush();
        
        // commission change
        this.logger.info(`Commission change events`);
        
        await this.processEvents(
            EventType.CommissionChange,
            'phalastakepool', 'poolcommissionset',
            100000,
            async(event : Event<Events.CommissionChange>, params : any[]) => {
                const onChainId = Number(params[0]);
                const newCommission = Polkadot.Utility.parseRawPercent(Number(params[1]));
                
                // calcualate delta
                const previousBlockHash = await this.phalaApi.rpc.chain.getBlockHash(event.blockNumber - 1);
                const onChainStakePoolRaw = await this.phalaApi.query
                    .phalaStakePool.stakePools
                    .at(previousBlockHash, onChainId);
                const onChainStakePool : typeof KhalaTypes.PoolInfo = <any>onChainStakePoolRaw.toJSON();
                
                const commissionDelta = newCommission - Polkadot.Utility.parseRawPercent(onChainStakePool.payoutCommission);
                
                event.stakePoolEntry = await this.getOrCreateStakePool(onChainId);
                event.additionalData = {
                    commission: newCommission,
                    delta: commissionDelta,
                };
            }
        );
        
        // contributions
        this.logger.info(`Contribution events`);
        
        await this.processEvents(
            EventType.Contribution,
            'phalastakepool', 'contribution',
            50000,
            async(event : Event<Events.Contribution>, params : any[]) => {
                event.stakePoolEntry = await this.getOrCreateStakePool(Number(params[0]));
                
                const hexAddr = (params[1].substring(0, 2) == '0x' ? '' : '0x') + params[1];
                const address = encodeAddress(hexAddr, OnChainEventsCrawler.PHALA_SS58FORMAT);
                event.sourceAccount = await this.getOrCreateAccount(address);
                
                event.amount = Phala.Utility.parseRawAmount(Number(params[2]));
            }
        );
        
        // withdrawals
        this.logger.info(`Widthdrawals events`);
        
        await this.processEvents(
            EventType.Withdrawal,
            'phalastakepool', 'withdrawal',
            50000,
            async(event : Event<Events.Withdrawal>, params : any[]) => {
                event.stakePoolEntry = await this.getOrCreateStakePool(Number(params[0]));
                
                const hexAddr = (params[1].substring(0, 2) == '0x' ? '' : '0x') + params[1];
                const address = encodeAddress(hexAddr, OnChainEventsCrawler.PHALA_SS58FORMAT);
                event.sourceAccount = await this.getOrCreateAccount(address);
                
                event.amount = Phala.Utility.parseRawAmount(Number(params[2]));
            }
        );
        
        // slashes
        this.logger.info(`Slash events`);
        
        await this.processEvents(
            EventType.Slash,
            'phalastakepool', 'poolslashed',
            50000,
            async(event : Event<Events.Slash>, params : any[]) => {
                event.stakePoolEntry = await this.getOrCreateStakePool(Number(params[0]));
                
                event.amount = Phala.Utility.parseRawAmount(Number(params[1]));
            }
        );
        
        // slashes
        this.logger.info(`Halving events`);
        
        await this.processEvents(
            EventType.Halving,
            'phalamining', 'subsidybudgethalved',
            400000,
            async() => {}
        );
    }
    
    protected async processEvents<T> (
        eventType : EventType,
        module : string,
        call : string,
        chunkSize : number,
        callback : (event : Event<T>, params : any[]) => Promise<void>
    )
    {
        if (this.appState.value[eventType] === undefined) {
            this.appState.value = {
                ...(new OnChainEventsCrawlerState()),
                ...this.appState.value
            };
        }
        
        while (true) {
            if (this.appState.value[eventType] >= this.finalizedBlockNumber) {
                break;
            }
            
            const firstBlock : number = this.appState.value[eventType];
            const lastBlock : number = Math.min(
                firstBlock + chunkSize - 1,
                this.finalizedBlockNumber
            );
            
            this.logger.log(`Next chunk`, firstBlock, lastBlock);
            
            try {
                await this._entityManagerWrapper.transaction(async(entityManager) => {
                    this._txEntityManager = entityManager;
                    
                    await this.processEventsChunk(
                        eventType,
                        firstBlock, lastBlock,
                        module, call,
                        callback
                    );
                    
                    await entityManager.flush();
                });
                
                // update app state
                this.appState.value[eventType] = lastBlock + 1;
                
                await this._entityManager.flush();
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    
    protected async processEventsChunk<T> (
        eventType : EventType,
        firstBlock : number,
        lastBlock : number,
        module : string,
        call : string,
        callback : (event : Event<T>, params : any[]) => Promise<void>
    )
    {
        const eventsGen = this.phalaSubscan.getEvents({
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

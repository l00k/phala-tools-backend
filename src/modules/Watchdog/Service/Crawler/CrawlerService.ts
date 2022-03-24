import { AppState } from '#/BackendCore/Domain/Model/AppState';
import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { ApiProvider } from '#/Phala/Service/ApiProvider';
import { CrawlerState } from '#/Watchdog/Domain/Model/AppState/CrawlerState';
import { AbstractHandler } from '#/Watchdog/Service/Crawler/AbstractHandler';
import { Event } from '#/Watchdog/Service/Crawler/Event';
import { Exception } from '#/BackendCore/Exception';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiPromise } from '@polkadot/api';
import { Header } from '@polkadot/types/interfaces/runtime';
import * as Trans from 'class-transformer';
import colors from 'colors';


type ObjectMap<V> = {
    [index : string] : V
};


export class CrawlerService
{
    
    protected static readonly BLOCK_HISTORY = 1000;
    protected static readonly BLOCK_CHUNK = 25;
    
    
    @Inject({ ctorArgs: [ CrawlerService.name ] })
    protected logger : Logger;
    
    @Inject()
    protected entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected apiProvider : ApiProvider;
    
    @Inject({ tag: 'pw.crawler.handler' })
    protected handlers : { [key : string] : AbstractHandler };
    
    
    protected txEntityManager : EntityManager;
    
    protected api : ApiPromise;
    
    
    protected appState : AppState<CrawlerState>;
    
    protected finalizedBlockNumber : number;
    
    
    public async run ()
    {
        await this.init();
        this.logger.log('Crawler ready');
        
        if (!this.handlers) {
            this.logger.debug('No handlers');
        }
        
        // await handlers init
        for (const handler of Object.values(this.handlers)) {
            await handler.init();
        }
        
        this.logger.log('Handlers initiated');
        
        // fetch basic api data
        const finalizedHead = await this.api.rpc.chain.getFinalizedHead();
        const finalizedBlockHeader : Header = await this.api.rpc.chain.getHeader(finalizedHead);
        this.finalizedBlockNumber = finalizedBlockHeader.number.toNumber();
        
        // todo ld 2022-03-21 20:18:30
        this.appState.value.lastFetchedBlock = 758240;
        // this.appState.value.lastFetchedBlock = Math.max(
        //     this.appState.value.lastFetchedBlock,
        //     this.finalizedBlockNumber - CrawlerService.BLOCK_HISTORY
        // );
        
        // process chunks
        // todo ld 2022-03-21 19:54:48
        while (true) {
            const blockDelta = this.finalizedBlockNumber - this.appState.value.lastFetchedBlock;
            if (blockDelta <= 0) {
                break;
            }
            
            this.logger.log(`Fetching ${CrawlerService.BLOCK_CHUNK} blocks chunk (${blockDelta} left)`);
            
            const result = await this.fetchBlocksChunk();
            if (!result) {
                return;
            }
        }
    }
    
    protected async init ()
    {
        this.api = await this.apiProvider.getApi();
        
        // fetch app state
        const entityManager = await this.entityManagerWrapper.getDirectEntityManager();
        const appStateRepository = entityManager.getRepository(AppState);
        
        this.appState = await appStateRepository.findOne(CrawlerState.ID);
        
        if (!this.appState) {
            this.appState = new AppState({
                id: CrawlerState.ID,
                value: new CrawlerState(),
            });
            
            appStateRepository.persist(this.appState);
            appStateRepository.flush();
        }
    }
    
    
    /*
     * Fetching new blocks
     */
    protected async fetchBlocksChunk ()
    {
        let blockNumber = this.appState.value.lastFetchedBlock;
        
        const lastBlockToIndex = Math.min(
            this.finalizedBlockNumber,
            blockNumber + CrawlerService.BLOCK_CHUNK
        );
        
        await this.entityManagerWrapper.transaction(async(txEntitiyManager) => {
            this.txEntityManager = txEntitiyManager;
            
            while (blockNumber < lastBlockToIndex) {
                ++blockNumber;
                
                this.logger.log('New block', blockNumber);
                await this.fetchNextNewBlock(blockNumber);
            }
            
            // chunk post processing
            this.logger.log('Handlers post processing');
            
            for (const handler of Object.values(this.handlers)) {
                handler.beforeHandle(txEntitiyManager);
                await handler.chunkPostProcess();
            }
        });
        
        return true;
    }
    
    protected async fetchNextNewBlock (blockNumber : number)
    {
        const blockHash : string = (await this.api.rpc.chain.getBlockHash(blockNumber)).toString();
        if (!blockHash) {
            throw new Exception('Block not found', 1613180182057);
        }
        
        const blockTimestamp : number = <any>(await this.api.query.timestamp.now.at(blockHash)).toJSON();
        const allEvents : any[] = <any>await this.api.query.system.events.at(blockHash);
        
        for (const { event: onChainEvent } of allEvents) {
            const event = Trans.plainToInstance(Event, {
                type: `${onChainEvent.section}::${onChainEvent.method}`,
                blockNumber,
                blockHash,
                blockDate: new Date(blockTimestamp),
                data: onChainEvent.data.toJSON(),
            });
            
            await this.handleEvent(event);
        }
        
        this.appState.value.lastFetchedBlock = blockNumber;
        this.txEntityManager.persist(this.appState);
    }
    
    protected async handleEvent (event : Event)
    {
        let canHandle = Object.values(this.handlers)
            .find(handler => handler.canHandle(event));
        if (!canHandle) {
            return;
        }
        
        for (const handler of Object.values(this.handlers)) {
            handler.beforeHandle(this.txEntityManager);
            
            const handled = await handler.tryHandle(event);
            if (handled) {
                this.logger.log('Event', colors.brightCyan(event.type), 'handled');
            }
        }
    }
    
}

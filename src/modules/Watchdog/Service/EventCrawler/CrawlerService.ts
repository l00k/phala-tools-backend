import { AppState } from '#/BackendCore/Domain/Model/AppState';
import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { ApiProvider } from '#/Phala/Service/ApiProvider';
import { ApiMode } from '#/Polkadot';
import { CrawlerState } from '#/Watchdog/Domain/Model/AppState/CrawlerState';
import { AbstractEventCrawler } from '#/Watchdog/Service/EventCrawler/AbstractEventCrawler';
import { Event } from '#/Watchdog/Service/EventCrawler/Event';
import { Inject } from '@inti5/object-manager';
import { Exception } from '@inti5/utils/Exception';
import { Logger } from '@inti5/utils/Logger';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiPromise } from '@polkadot/api';
import { Header } from '@polkadot/types/interfaces/runtime';
import * as Trans from 'class-transformer';
import colors from 'colors';
import isEmpty from 'lodash/isEmpty';


type ObjectMap<V> = {
    [index : string] : V
};


export class CrawlerService
{
    
    protected static readonly BLOCK_HISTORY = 250;
    protected static readonly BLOCK_CHUNK = 100;
    
    
    @Inject({ ctorArgs: [ CrawlerService.name ] })
    protected _logger : Logger;
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _apiProvider : ApiProvider;
    
    @Inject({ tag: 'watchdog.crawler.handler' })
    protected _handlers : { [key : string] : AbstractEventCrawler };
    
    
    protected _txEntityManager : EntityManager;
    
    protected _api : ApiPromise;
    
    
    protected _appState : AppState<CrawlerState>;
    
    protected _finalizedBlockNumber : number;
    
    
    public async run ()
    {
        await this._init();
        this._logger.log('Crawler ready');
        
        if (isEmpty(this._handlers)) {
            this._logger.debug('No handlers');
        }
        
        // await handlers init
        for (const handler of Object.values(this._handlers)) {
            await handler.init();
        }
        
        this._logger.log('Handlers initiated');
        
        // fetch basic api data
        const finalizedHead = await this._api.rpc.chain.getFinalizedHead();
        const finalizedBlockHeader : Header = await this._api.rpc.chain.getHeader(finalizedHead);
        this._finalizedBlockNumber = finalizedBlockHeader.number.toNumber();
        
        this._appState.value.lastFetchedBlock = Math.max(
            this._appState.value.lastFetchedBlock,
            this._finalizedBlockNumber - CrawlerService.BLOCK_HISTORY
        );
        
        // process chunks
        while (true) {
            const blockDelta = this._finalizedBlockNumber - this._appState.value.lastFetchedBlock;
            if (blockDelta <= 0) {
                break;
            }
            
            this._logger.log(`Fetching ${CrawlerService.BLOCK_CHUNK} blocks chunk (${blockDelta} left)`);
            
            const result = await this._fetchBlocksChunk();
            if (!result) {
                return;
            }
        }
    }
    
    protected async _init ()
    {
        this._api = await this._apiProvider.getApi(ApiMode.WS);
        
        // fetch app state
        const entityManager = await this._entityManagerWrapper.getCommonEntityManager();
        const appStateRepository = entityManager.getRepository(AppState);
        
        this._appState = await appStateRepository.findOne(CrawlerState.ID);
        
        if (!this._appState) {
            this._appState = new AppState({
                id: CrawlerState.ID,
                value: new CrawlerState(),
            });
            
            appStateRepository.persist(this._appState);
            appStateRepository.flush();
        }
    }
    
    
    /*
     * Fetching new blocks
     */
    protected async _fetchBlocksChunk ()
    {
        let blockNumber = this._appState.value.lastFetchedBlock;
        
        const lastBlockToIndex = Math.min(
            this._finalizedBlockNumber,
            blockNumber + CrawlerService.BLOCK_CHUNK
        );
        
        await this._entityManagerWrapper.transaction(async(txEntitiyManager) => {
            this._txEntityManager = txEntitiyManager;
            
            for (const handler of Object.values(this._handlers)) {
                await handler.bindEntityManager(txEntitiyManager);
            }
            
            while (blockNumber < lastBlockToIndex) {
                ++blockNumber;
                
                this._logger.log('New block', blockNumber);
                await this._fetchNextNewBlock(blockNumber);
            }
            
            // chunk post processing
            this._logger.log('Handlers post processing');
            
            for (const handler of Object.values(this._handlers)) {
                await handler.postProcess();
            }
        });
        
        return true;
    }
    
    protected async _fetchNextNewBlock (blockNumber : number)
    {
        const blockHash : string = (await this._api.rpc.chain.getBlockHash(blockNumber)).toString();
        if (!blockHash) {
            throw new Exception('Block not found', 1613180182057);
        }
        
        const blockTimestamp : number = <any>(await this._api.query.timestamp.now.at(blockHash)).toJSON();
        const allEvents : any[] = <any>await this._api.query.system.events.at(blockHash);
        
        for (const { event: onChainEvent } of allEvents) {
            const event = Trans.plainToInstance(Event, {
                type: `${onChainEvent.section}::${onChainEvent.method}`,
                blockNumber,
                blockHash,
                blockDate: new Date(blockTimestamp),
                data: onChainEvent.data.toJSON(),
            });
            
            await this._handleEvent(event);
        }
        
        this._appState.value.lastFetchedBlock = blockNumber;
        this._txEntityManager.persist(this._appState);
    }
    
    protected async _handleEvent (event : Event)
    {
        for (const handler of Object.values(this._handlers)) {
            const handled = await handler.tryHandle(event);
            if (handled) {
                this._logger.log('Event', colors.brightCyan(event.type), 'handled');
            }
        }
    }
    
}

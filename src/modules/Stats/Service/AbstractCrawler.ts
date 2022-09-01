import { AppState } from '#/BackendCore/Domain/Model/AppState';
import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import * as Phala from '#/Phala';
import { Account } from '#/Phala/Domain/Model';
import { PhalaEntityFetcher } from '#/Phala/Service/PhalaEntityFetcher';
import { ApiMode } from '#/Polkadot';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import { Worker } from '#/Stats/Domain/Model/Worker';
import { InitializeSymbol, Inject, ObjectManager } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { EntityManager } from '@mikro-orm/core';
import { ApiPromise } from '@polkadot/api';
import { Header } from '@polkadot/types/interfaces/runtime';



export abstract class AbstractCrawler
{
    
    protected _logger : Logger;
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _phalaApiProvider : Phala.ApiProvider;
    
    @Inject({ ctorArgs: [ ApiMode.WS ] })
    protected _phalaEntityFetcher : PhalaEntityFetcher;
    
    protected _entityManager : EntityManager;
    protected _txEntityManager : EntityManager;
    
    protected _phalaApi : ApiPromise;
    
    protected _appStateClass : any = null;
    protected _appState : AppState<any>;
    
    protected _finalizedBlockHeader : Header;
    protected _finalizedBlockNumber : number;
    
    protected _stakePoolEntries : Record<number, StakePoolEntry> = {};
    protected _accounts : Record<string, Account> = {};
    
    
    
    public [InitializeSymbol] ()
    {
        this._logger = ObjectManager.getSingleton().getInstance(Logger, [ this.constructor.name ]);
    }
    
    public async run () : Promise<any>
    {
        await this._init();
        await this._process();
    }
    
    protected async _init ()
    {
        this._entityManager = this._entityManagerWrapper.getCleanEntityManager();
        
        this._phalaApi = await this._phalaApiProvider.getApi(ApiMode.WS);
        
        // find chain header
        const finalizedHead = await this._phalaApi.rpc.chain.getFinalizedHead();
        
        this._finalizedBlockHeader = await this._phalaApi.rpc.chain.getHeader(finalizedHead);
        this._finalizedBlockNumber = this._finalizedBlockHeader.number.toNumber();
        
        // fetch app state
        if (this._appStateClass) {
            const appStateRepository = this._entityManager.getRepository(AppState);
            this._appState = await appStateRepository.findOne(this._appStateClass.ID);
            
            if (!this._appState) {
                this._appState = new AppState({
                    id: this._appStateClass.ID,
                    value: new this._appStateClass(),
                });
                
                appStateRepository.persist(this._appState);
                appStateRepository.flush();
            }
        }
    }
    
    protected abstract _process () : Promise<any>;
    
    
    
    protected async _clearContext ()
    {
        this._stakePoolEntries = {};
    }
    
    protected async _getOrCreateStakePool (onChainId : number) : Promise<StakePoolEntry>
    {
        if (!this._stakePoolEntries[onChainId]) {
            const stakePoolEntryRepository = this._txEntityManager.getRepository(StakePoolEntry);
            
            let stakePoolEntry : StakePoolEntry = await stakePoolEntryRepository.findOne({ stakePool: { onChainId } });
            if (!stakePoolEntry) {
                const stakePool = await this._phalaEntityFetcher.getOrCreateStakePool(onChainId);
                
                stakePoolEntry = new StakePoolEntry({
                    stakePool,
                }, this._txEntityManager);
                
                this._txEntityManager.persist(stakePoolEntry);
            }
            
            this._stakePoolEntries[onChainId] = stakePoolEntry;
        }
        
        return this._stakePoolEntries[onChainId];
    }
    
    protected async _getOrCreateAccount (address : string) : Promise<Account>
    {
        if (!this._accounts[address]) {
            this._accounts[address] = await this._phalaEntityFetcher.getOrCreateAccount(address);
        }
        
        return this._accounts[address];
    }
    
}

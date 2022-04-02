import { AbstractTasker } from '#/App/Service/AbstractTasker';
import { AppState } from '#/BackendCore/Domain/Model/AppState';
import * as Phala from '#/Phala';
import { Account } from '#/Phala/Domain/Model';
import { PhalaEntityFetcher } from '#/Phala/Service/PhalaEntityFetcher';
import { ApiMode } from '#/Polkadot';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import { Worker } from '#/Stats/Domain/Model/Worker';
import { Inject } from '@inti5/object-manager';
import { ApiPromise } from '@polkadot/api';
import { Header } from '@polkadot/types/interfaces/runtime';



type Mapped<T> = { [key : string | number] : T };


export abstract class AbstractCrawler
    extends AbstractTasker
{
    
    @Inject()
    protected _phalaApiProvider : Phala.ApiProvider;
    
    @Inject({ ctorArgs: [ ApiMode.WS ] })
    protected _phalaEntityFetcher : PhalaEntityFetcher;
    
    protected _phalaApi : ApiPromise;
    
    protected _appStateClass : any = null;
    protected _appState : AppState<any>;
    
    protected _finalizedBlockHeader : Header;
    protected _finalizedBlockNumber : number;
    
    protected _stakePoolEntries : Mapped<StakePoolEntry> = {};
    protected _accounts : Mapped<Account> = {};
    protected _workers : Mapped<Worker> = {};
    
    
    
    protected async _init ()
    {
        await super._init();
        
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
    
    protected async _clearContext ()
    {
        this._stakePoolEntries = {};
        this._accounts = {};
        this._workers = {};
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
    
    protected async _getOrCreateWorker (publicKey : string, stakePool : StakePoolEntry) : Promise<Worker>
    {
        if (!this._workers[publicKey]) {
            const workerRepository = this._entityManager.getRepository(Worker);
            
            let worker = await workerRepository.findOne({ publicKey });
            if (!worker) {
                worker = new Worker({
                    publicKey,
                    stakePool,
                }, this._entityManager);
                
                const workerOnChain : typeof Phala.KhalaTypes.WorkerInfo =
                    <any>(await this._phalaApi.query.phalaRegistry.workers(publicKey)).toJSON();
                
                worker.operator = await this._getOrCreateAccount(workerOnChain.operator);
                worker.initialScore = workerOnChain.initialScore;
                worker.confidenceLevel = workerOnChain.confidenceLevel;
                
                this._txEntityManager.persist(worker);
            }
            
            this._workers[publicKey] = worker;
        }
        
        return this._workers[publicKey];
    }
    
}

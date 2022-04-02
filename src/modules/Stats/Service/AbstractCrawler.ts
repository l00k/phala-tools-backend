import { AbstractTasker } from '#/App/Service/AbstractTasker';
import { AppState } from '#/BackendCore/Domain/Model/AppState';
import * as Phala from '#/Phala';
import { Account } from '#/Phala/Domain/Model';
import { PhalaEntityFetcher } from '#/Phala/Service/PhalaEntityFetcher';
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
    protected phalaApiProvider : Phala.ApiProvider;
    
    @Inject()
    protected _phalaEntityFetcher : PhalaEntityFetcher;
    
    protected phalaApi : ApiPromise;
    
    protected appStateClass : any = null;
    protected appState : AppState<any>;
    
    protected finalizedBlockHeader : Header;
    protected finalizedBlockNumber : number;
    
    protected stakePoolEntries : Mapped<StakePoolEntry> = {};
    protected accounts : Mapped<Account> = {};
    protected workers : Mapped<Worker> = {};
    
    
    
    protected async _init ()
    {
        await super._init();
        
        this.phalaApi = await this.phalaApiProvider.getApi();
        
        // find chain header
        const finalizedHead = await this.phalaApi.rpc.chain.getFinalizedHead();
        
        this.finalizedBlockHeader = await this.phalaApi.rpc.chain.getHeader(finalizedHead);
        this.finalizedBlockNumber = this.finalizedBlockHeader.number.toNumber();
        
        // fetch app state
        if (this.appStateClass) {
            const appStateRepository = this._entityManager.getRepository(AppState);
            this.appState = await appStateRepository.findOne(this.appStateClass.ID);
            
            if (!this.appState) {
                this.appState = new AppState({
                    id: this.appStateClass.ID,
                    value: new this.appStateClass(),
                });
                
                appStateRepository.persist(this.appState);
                appStateRepository.flush();
            }
        }
    }
    
    protected async clearContext ()
    {
        this.stakePoolEntries = {};
        this.accounts = {};
        this.workers = {};
    }
    
    
    protected async getOrCreateStakePool (onChainId : number) : Promise<StakePoolEntry>
    {
        if (!this.stakePoolEntries[onChainId]) {
            const stakePoolEntryRepository = this._entityManager.getRepository(StakePoolEntry);
            
            let stakePoolEntry : StakePoolEntry = await stakePoolEntryRepository.findOne({ stakePool: { onChainId } });
            if (!stakePoolEntry) {
                const stakePool = await this._phalaEntityFetcher.getOrCreateStakePool(onChainId);
                
                stakePoolEntry = new StakePoolEntry({
                    stakePool,
                }, this._entityManager);
                
                this._entityManager.persist(stakePoolEntry);
            }
            
            this.stakePoolEntries[onChainId] = stakePoolEntry;
        }
        
        return this.stakePoolEntries[onChainId];
    }
    
    protected async getOrCreateAccount (address : string) : Promise<Account>
    {
        if (!this.accounts[address]) {
            const accountRepository = this._entityManager.getRepository(Account);
            
            let account = await accountRepository.findOne({ address });
            if (!account) {
                account = new Account({ address }, this._entityManager);
                this._entityManager.persist(account);
            }
            
            this.accounts[address] = account;
        }
        
        return this.accounts[address];
    }
    
    protected async getOrCreateWorker (publicKey : string, stakePool : StakePoolEntry) : Promise<Worker>
    {
        if (!this.workers[publicKey]) {
            const workerRepository = this._entityManager.getRepository(Worker);
            
            let worker = await workerRepository.findOne({ publicKey });
            if (!worker) {
                worker = new Worker({
                    publicKey,
                    stakePool,
                }, this._entityManager);
                
                const workerOnChain : typeof Phala.KhalaTypes.WorkerInfo =
                    <any>(await this.phalaApi.query.phalaRegistry.workers(publicKey)).toJSON();
                
                worker.operator = await this.getOrCreateAccount(workerOnChain.operator);
                worker.initialScore = workerOnChain.initialScore;
                worker.confidenceLevel = workerOnChain.confidenceLevel;
                
                this._entityManager.persist(worker);
            }
            
            this.workers[publicKey] = worker;
        }
        
        return this.workers[publicKey];
    }
    
}

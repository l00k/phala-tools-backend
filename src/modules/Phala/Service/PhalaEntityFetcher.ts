import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { ApiProvider } from '#/Phala';
import { Account } from '#/Phala/Domain/Model/Account';
import { StakePool } from '#/Phala/Domain/Model/StakePool';
import { ApiMode } from '#/Polkadot';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import * as PolkadotUtils from '@polkadot/util';



export class PhalaEntityFetcher
{
    
    @Inject({ ctorArgs: [ PhalaEntityFetcher.name ] })
    protected _logger : Logger;
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _apiProvider : ApiProvider;
    
    protected _apiMode : ApiMode;
    
    protected _stakePools : Record<number, StakePool> = {};
    protected _accounts : Record<string, Account> = {};
    
    
    public constructor (apiMode = ApiMode.WS)
    {
        this._apiMode = apiMode;
    }
    
    
    public async getOrCreateStakePool (onChainId : number) : Promise<StakePool>
    {
        if (!this._stakePools[onChainId]) {
            this._stakePools[onChainId] = await this._createStakePool(onChainId);
        }
        
        return this._stakePools[onChainId];
    }
    
    protected async _createStakePool (onChainId : number) : Promise<StakePool>
    {
        const entityManager = this._entityManagerWrapper.getCommonEntityManager();
        const stakePoolRepository = entityManager.getRepository(StakePool);
        
        let stakePool = await stakePoolRepository.findOne({ onChainId });
        if (!stakePool) {
            const api = await this._apiProvider.getApi(this._apiMode);
            
            const onChainStakePool : any =
                <any>(await api.query.phalaStakePool.stakePools(onChainId)).toJSON();
            if (!onChainStakePool) {
                return null;
            }
            
            stakePool = new StakePool({
                onChainId,
            }, entityManager);
            
            stakePool.owner = await this.getOrCreateAccount(onChainStakePool.owner);
            
            await stakePoolRepository.persistAndFlush(stakePool);
        }
        
        return stakePool;
    }
    
    
    public async getOrCreateAccount (address : string) : Promise<Account>
    {
        if (!this._accounts[address]) {
            this._accounts[address] = await this._createAccount(address);
        }
        
        return this._accounts[address];
    }
    
    protected async _createAccount (address : string) : Promise<Account>
    {
        const entityManager = this._entityManagerWrapper.getCommonEntityManager();
        const accountRepository = entityManager.getRepository(Account);
        
        let account = await accountRepository.findOne({ address });
        if (!account) {
            const api = await this._apiProvider.getApi(this._apiMode);
            
            account = new Account({ address }, entityManager);
            
            const onChainIdentity : any =
                (await api.query.identity.identityOf(account.address)).toHuman();
            if (onChainIdentity) {
                account.identity = PolkadotUtils.isHex(onChainIdentity.info.display.Raw)
                    ? PolkadotUtils.hexToString(onChainIdentity.info.display.Raw)
                    : onChainIdentity.info.display.Raw;
            }
            
            await accountRepository.persistAndFlush(account);
        }
        
        return account;
    }
    
    
}

import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { ApiProvider, KhalaTypes } from '#/Phala';
import * as Polkadot from '#/Polkadot';
import { Account } from '#/Watchdog/Domain/Model/Account';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { EntityManager } from '@mikro-orm/mysql';
import * as PolkadotUtils from '@polkadot/util';
import { Inject } from 'core/object-manager';
import { Logger } from 'core/utils/Logger';



export class PhalaEntityFetcher
{
    
    @Inject({ ctorArgs: [ PhalaEntityFetcher.name ] })
    protected _logger : Logger;
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _apiProvider : ApiProvider;
    
    
    protected _getEntityManager () : EntityManager
    {
        return this._entityManagerWrapper.getDirectEntityManager();
    }
    
    
    public async getOrCreateStakePool(onChainId : number) : Promise<StakePool>
    {
        const entityManager = this._getEntityManager();
        const stakePoolRepository = entityManager.getRepository(StakePool);
        
        let stakePool = await stakePoolRepository.findOne({ onChainId });
        if (!stakePool) {
            const api = await this._apiProvider.getApi(Polkadot.ApiMode.HTTP);
        
            const onChainStakePool : typeof KhalaTypes.PoolInfo =
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
    
    public async getOrCreateAccount(address : string) : Promise<Account>
    {
        const entityManager = this._getEntityManager();
        const accountRepository = entityManager.getRepository(Account);
        
        let account = await accountRepository.findOne({
            address: { $eq: address }
        });
        if (!account) {
            const api = await this._apiProvider.getApi(Polkadot.ApiMode.HTTP);
            
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

import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { ApiProvider, KhalaTypes } from '#/Phala';
import { Account } from '#/Phala/Domain/Model/Account';
import { StakePool } from '#/Phala/Domain/Model/StakePool';
import * as Polkadot from '#/Polkadot';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { EntityManager } from '@mikro-orm/mysql';
import * as PolkadotUtils from '@polkadot/util';



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
    
    
    public async getOrCreateStakePool (onChainId : number) : Promise<StakePool>
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
    
    public async getOrCreateAccount (address : string) : Promise<Account>
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

import { CrudController } from '#/BackendCore/Controller/CrudController';
import { ApiProvider } from '#/Phala';
import * as Polkadot from '#/Polkadot';
import { Account } from '#/Watchdog/Domain/Model/Account';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { Annotation as API } from '@inti5/api-backend';
import { Inject } from 'core/object-manager';
import { Assert } from 'core/validator/Method';
import * as PolkadotUtils from '@polkadot/util';


export class AccountController
    extends CrudController<StakePool>
{
    
    protected static readonly ENTITY = Account;
    
    @Inject()
    protected _apiProvider : ApiProvider;
    
    
    @API.CRUD.GetItem(() => Account, { path: '#PATH#/by_address/:address' })
    public async getOrCreateAccount (
        @Assert({ custom: Polkadot.Utility.isAddress })
        @API.Param('address')
            address : string
    ) : Promise<Account>
    {
        const accountRepository = this._entityManager.getRepository(Account);
        
        let account = await accountRepository.findOne({
            address : { $eq: address }
        });
        if (!account) {
            account = new Account({ address }, this._entityManager);
            
            const api = await this._apiProvider.getApi(Polkadot.ApiMode.HTTP);
            
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

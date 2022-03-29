import { CrudController } from '#/BackendCore/Controller/CrudController';
import { ApiProvider } from '#/Phala';
import * as Polkadot from '#/Polkadot';
import { Account } from '#/Watchdog/Domain/Model/Account';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { PhalaEntityFetcher } from '#/Watchdog/Service/PhalaEntityFetcher';
import { Annotation as API } from '@inti5/api-backend';
import { Inject } from '@inti5/object-manager';
import { Assert } from '@inti5/validator/Method';
import * as PolkadotUtils from '@polkadot/util';
import * as Router from 'core/express-ext';


export class AccountController
    extends CrudController<StakePool>
{
    
    protected static readonly ENTITY = Account;
    
    @Inject()
    protected _phalaEntityFetcher : PhalaEntityFetcher;
    
    
    @API.CRUD.GetItem(() => Account, { path: '#PATH#/by_address/:address' })
    public async getOrCreateAccount (
        @Router.Param('address')
        @Assert({ custom: Polkadot.Utility.isAddress })
            address : string
    ) : Promise<Account>
    {
        return this._phalaEntityFetcher.getOrCreateAccount(address);
    }
    
}

import { CrudController } from '#/BackendCore/Controller/CrudController';
import { PhalaEntityFetcher } from '#/Phala/Service/PhalaEntityFetcher';
import * as Polkadot from '#/Polkadot';
import { Account } from '#/Watchdog/Domain/Model/Account';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import { Inject } from '@inti5/object-manager';
import { Assert } from '@inti5/validator/Method';


export class AccountController
    extends CrudController<StakePool>
{
    
    protected static readonly ENTITY = Account;
    
    @Inject()
    protected _phalaEntityFetcher : PhalaEntityFetcher;
    
    
    @API.CRUD.GetItem(() => Account, { path: '#PATH#/find/:address' })
    public async getOrCreateAccount (
        @Router.Param('address')
        @Assert({ custom: Polkadot.Utility.isAddress })
            address : string
    ) : Promise<Account>
    {
        return this._phalaEntityFetcher.getOrCreateAccount(address);
    }
    
}

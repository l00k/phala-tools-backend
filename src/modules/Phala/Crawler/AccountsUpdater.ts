import { AbstractTasker } from '#/App/Service/AbstractTasker';
import * as Phala from '#/Phala';
import { Account } from '#/Phala/Domain/Model';
import { ApiMode } from '#/Polkadot';
import { ApiPromise } from '@polkadot/api';
import * as PolkadotUtils from '@polkadot/util';
import { Inject } from 'core/object-manager';


export class AccountsUpdater
    extends AbstractTasker
{
    
    @Inject()
    protected phalaApiProvider : Phala.ApiProvider;
    
    protected phalaApi : ApiPromise;
    
    
    protected async _init ()
    {
        await super._init();
        
        this.phalaApi = await this.phalaApiProvider.getApi(ApiMode.WS);
    }
    
    protected async _process ()
    {
        const accountRepository = this._entityManager.getRepository(Account);
        const accounts = await accountRepository.findAll();
        
        let accountIdx = 0;
        for (const account of accounts) {
            // update identity
            const onChainIdentity : any =
                (await this.phalaApi.query.identity.identityOf(account.address)).toHuman();
            
            if (onChainIdentity) {
                account.identity = PolkadotUtils.isHex(onChainIdentity.info.display.Raw)
                    ? PolkadotUtils.hexToString(onChainIdentity.info.display.Raw)
                    : onChainIdentity.info.display.Raw;
                
                account.identityVerified = onChainIdentity.judgements.length > 0;
            }
            
            if (accountIdx++ % 250 == 249) {
                this._logger.debug(`Processing accounts`, (accountIdx / accounts.length * 100).toFixed(1) + '%');
            }
        }
        
        this._entityManager.flush();
    }
    
    
}

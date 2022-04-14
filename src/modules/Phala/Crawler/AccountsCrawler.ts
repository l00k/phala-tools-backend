import { Account } from '#/Phala/Domain/Model';
import { AbstractCrawler } from '#/Phala/Service/AbstractCrawler';
import * as PolkadotUtils from '@polkadot/util';


export class AccountsCrawler
    extends AbstractCrawler
{
    
    protected async _process () : Promise<boolean>
    {
        const accountRepository = this._entityManager.getRepository(Account);
        const accounts = await accountRepository.findAll();
        
        let accountIdx = 0;
        for (const account of accounts) {
            // update identity
            const onChainIdentityRaw : any = await this._api.query.identity.identityOf(account.address);
            const onChainIdentity : any = onChainIdentityRaw.toHuman();
            
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
        
        return true;
    }
    
    
}

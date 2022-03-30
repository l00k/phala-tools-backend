import { AbstractCrawler } from '#/Stats/Service/AbstractCrawler';
import { Inject, Injectable } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import { Account } from '#/Stats/Domain/Model/Account';
import * as PolkadotUtils from '@polkadot/util';
import * as Phala from '#/Phala';
import { Timeout } from '@inti5/utils/Timeout';


@Injectable({ tag: 'tasker.handler' })
export class AccountsCrawler
    extends AbstractCrawler
{
    
    @Inject({ ctorArgs: [ AccountsCrawler.name ] })
    protected logger : Logger;
    
    
    @Task({
        cronExpr: '50 4 * * *'
    })
    @Timeout(5 * 60 * 1000)
    public async run ()
    {
        await this.init();
        
        const accountRepository = this.entityManagerDirect.getRepository(Account);
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
            
            // update balance
            const onChainAccount : any =
                <any>(await this.phalaApi.query.system.account(account.address)).toJSON();
            
            if (onChainAccount) {
                account.balanceTotal = Phala.Utility.parseRawAmount(Number(onChainAccount.data.free) + Number(onChainAccount.data.reserved));
                account.balanceTransferable = Phala.Utility.parseRawAmount(Number(onChainAccount.data.free) - Number(onChainAccount.data.miscFrozen));
            }
            
            const locks : any[] =
                <any>(await this.phalaApi.query.balances.locks(account.address)).toJSON();
            
            account.balanceStaked = locks.reduce((acc, lock) => {
                const lockId = PolkadotUtils.isHex(lock.id)
                    ? PolkadotUtils.hexToString(lock.id)
                    : lock.id;
                return acc + (lockId == Phala.LockReason.Staking ? Phala.Utility.parseRawAmount(Number(lock.amount)) : 0);
            }, 0);
            
            if (accountIdx++ % 250 == 249) {
                this.logger.debug(`Processing accounts`, (accountIdx / accounts.length * 100).toFixed(1) + '%');
            }
        }
        
        this.entityManagerDirect.flush();
    }
    
    
}

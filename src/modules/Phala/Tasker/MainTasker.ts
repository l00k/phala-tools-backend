import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import { AccountsCrawler } from '#/Phala/Crawler/AccountsCrawler';
import { StakePoolsCrawler } from '#/Phala/Crawler/StakePoolsCrawler';
import { Inject, Injectable } from '@inti5/object-manager';
import { Timeout } from '@inti5/utils/Timeout';


@Injectable({ tag: 'tasker.handler' })
export class MainTasker
{
    
    @Inject()
    protected _accountsUpdater : AccountsCrawler;
    
    @Inject()
    protected _stakePoolsFetcher : StakePoolsCrawler;
    
    
    @Task({ cronExpr: '50 4 * * *' })
    @Timeout(30 * 60 * 1000)
    public async updateAccounts ()
    {
        await this._accountsUpdater.run();
    }
    
    @Task({ cronExpr: '45 * * * *' })
    @Timeout(30 * 60 * 1000)
    public async fetchNewStakePools ()
    {
        await this._stakePoolsFetcher.run();
    }
    
}

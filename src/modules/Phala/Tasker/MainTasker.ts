import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import { AccountsUpdater } from '#/Phala/Crawler/AccountsUpdater';
import { StakePoolsFetcher } from '#/Phala/Crawler/StakePoolsFetcher';
import { Inject, Injectable } from '@inti5/object-manager';
import { Timeout } from '@inti5/utils/Timeout';


@Injectable({ tag: 'tasker.handler' })
export class MainTasker
{
    
    @Inject()
    protected _accountsUpdater : AccountsUpdater;
    
    @Inject()
    protected _stakePoolsFetcher : StakePoolsFetcher;
    
    
    @Task({
        cronExpr: '50 4 * * *'
    })
    @Timeout(5 * 60 * 1000)
    public async updateAccounts ()
    {
        return this._accountsUpdater.run();
    }
    
    @Task({
        cronExpr: '45 * * * *'
    })
    @Timeout(5 * 60 * 1000)
    public async fetchNewStakePools ()
    {
        return this._stakePoolsFetcher.run();
    }
    
}

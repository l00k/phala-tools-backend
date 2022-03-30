import { AbstractTasker } from '#/App/Service/AbstractTasker';
import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import * as Phala from '#/Phala';
import { StakePool } from '#/Phala/Domain/Model';
import { PhalaEntityFetcher } from '#/Phala/Service/PhalaEntityFetcher';
import { ApiMode } from '#/Polkadot';
import { Inject, Injectable } from '@inti5/object-manager';
import { PromiseAggregator } from '@inti5/utils/PromiseAggregator';
import { Timeout } from '@inti5/utils/Timeout';
import { ApiPromise } from '@polkadot/api';
import range from 'lodash/range';


@Injectable({ tag: 'tasker.handler' })
export class StakePoolsFetcher
    extends AbstractTasker
{
    
    @Inject()
    protected _phalaApiProvider : Phala.ApiProvider;
    
    @Inject()
    protected _phalaEntityFetcher : PhalaEntityFetcher;
    
    protected _phalaApi : ApiPromise;
    
    
    @Task({
        cronExpr: '45 * * * *'
    })
    @Timeout(5 * 60 * 1000)
    public async run ()
    {
        return super.run();
    }
    
    protected async _init ()
    {
        await super._init();
        
        this._phalaApi = await this._phalaApiProvider.getApi(ApiMode.WS);
    }
    
    protected async _process ()
    {
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        
        // get stake pool count
        const stakePoolCount : number = <any>(await this._phalaApi.query.phalaStakePool.poolCount()).toJSON();
        const lastStakePoolId = stakePoolCount - 1;
        
        // check last stake pool
        const lastStoredStakePool = await stakePoolRepository.findOne({}, [], { onChainId: 'DESC' });
        const lastStoredStakePoolId : number = lastStoredStakePool
            ? lastStoredStakePool.onChainId
            : -1;
        
        if (lastStoredStakePoolId == lastStakePoolId) {
            return;
        }
        
        await PromiseAggregator.allSettled(
            range(lastStoredStakePoolId + 1, stakePoolCount - 1),
            (pid) => this._phalaEntityFetcher.getOrCreateStakePool(pid)
        );
    }
    
    
}

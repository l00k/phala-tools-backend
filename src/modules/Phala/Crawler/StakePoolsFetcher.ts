import { AbstractTasker } from '#/App/Service/AbstractTasker';
import * as Phala from '#/Phala';
import { StakePool } from '#/Phala/Domain/Model';
import { PhalaEntityFetcher } from '#/Phala/Service/PhalaEntityFetcher';
import { ApiMode } from '#/Polkadot';
import { ApiPromise } from '@polkadot/api';
import { Inject } from 'core/object-manager';
import { PromiseAggregator } from 'core/utils/PromiseAggregator';
import range from 'lodash/range';


export class StakePoolsFetcher
    extends AbstractTasker
{
    
    @Inject()
    protected _phalaApiProvider : Phala.ApiProvider;
    
    @Inject()
    protected _phalaEntityFetcher : PhalaEntityFetcher;
    
    protected _phalaApi : ApiPromise;
    
    
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
        const lastStoredStakePool = await stakePoolRepository.findOne(
            { onChainId: { $ne: null } },
            [],
            { onChainId: 'DESC' }
        );
        const lastStoredStakePoolId : number = lastStoredStakePool
            ? lastStoredStakePool.onChainId
            : -1;
        
        if (lastStoredStakePoolId == lastStakePoolId) {
            return;
        }
        
        for (let pid = lastStoredStakePoolId + 1; pid < stakePoolCount; ++pid) {
            await this._phalaEntityFetcher.getOrCreateStakePool(pid);
        }
    }
    
    
}

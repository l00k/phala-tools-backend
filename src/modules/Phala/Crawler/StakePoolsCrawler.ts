import { StakePool } from '#/Phala/Domain/Model';
import { AbstractCrawler } from '#/Phala/Service/AbstractCrawler';
import { PhalaEntityFetcher } from '#/Phala/Service/PhalaEntityFetcher';
import { Inject } from '@inti5/object-manager';


export class StakePoolsCrawler
    extends AbstractCrawler
{
    
    @Inject()
    protected _phalaEntityFetcher : PhalaEntityFetcher;
    
    
    protected async _process () : Promise<boolean>
    {
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        
        // get stake pool count
        const stakePoolCount : number = <any>(await this._api.query.phalaBasePool.poolCount()).toJSON();
        const lastStakePoolId = stakePoolCount - 1;
        
        // check last stake pool
        const lastStoredStakePool = await stakePoolRepository.findOne(
            { onChainId: { $ne: null } },
            {
                orderBy: { onChainId: 'DESC' }
            }
        );
        const lastStoredStakePoolId : number = lastStoredStakePool
            ? lastStoredStakePool.onChainId
            : -1;
        
        if (lastStoredStakePoolId == lastStakePoolId) {
            return false;
        }
        
        const delta = lastStakePoolId - lastStoredStakePoolId;
        this._logger.log('Fetching', delta, 'new pools');
        
        for (let pid = lastStoredStakePoolId + 1; pid < stakePoolCount; ++pid) {
            await this._phalaEntityFetcher.getOrCreateStakePool(pid);
        }
        
        return true;
    }
    
    
}

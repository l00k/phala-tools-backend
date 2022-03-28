import { CrudController } from '#/BackendCore/Controller/CrudController';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';


export class StakePoolController
    extends CrudController<StakePool>
{
    
    protected static readonly ENTITY = StakePool;
    
    
    @API.CRUD.GetCollection(() => StakePool)
    public async getStakePoolCollection (
        @API.Filters(() => StakePool)
            filters : Api.Domain.Filters<StakePool>,
        @API.Sorting(() => StakePool)
            sorting : Api.Domain.Sorting<StakePool>,
        @API.Pagination()
            pagination : Api.Domain.Pagination,
    ) : Promise<Api.Domain.Collection<StakePool>>
    {
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        
        const items = await stakePoolRepository.find(
            filters.toQueryFilters(),
            {
                populate: [ 'owner' ],
                orderBy: sorting.toOrderByMap(),
                limit: pagination.itemsPerPage,
                offset: pagination.offset,
            }
        );
        const total = await stakePoolRepository.count(filters.toQueryFilters());
        
        return { items, total };
    }
    
}

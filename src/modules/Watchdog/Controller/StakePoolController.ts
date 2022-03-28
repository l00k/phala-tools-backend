import { CrudController } from '#/BackendCore/Controller/CrudController';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';


export class StakePoolController
    extends CrudController<StakePool>
{
    
    @API.CRUD.GetCollection(() => StakePool)
    public async getStakePoolCollection (
        @API.Filters(() => StakePool)
            filters : ORM.FilterQuery<StakePool>,
        @API.Sorting(() => StakePool)
            sorting : ORM.QueryOrderMap,
        @API.Pagination()
            pagination : Api.Domain.Pagination,
    ) : Promise<Api.Domain.Collection<StakePool>>
    {
        const entityManager = this._entityManagerWrapper.getDirectEntityManager();
        const stakePoolRepository = entityManager.getRepository(StakePool);
        
        // build query and fetch collection
        const collection : Api.Domain.Collection<StakePool> = {
            items: [],
            total: 0,
        };
        
        collection.items = await stakePoolRepository.find(
            filters,
            {
                orderBy: sorting,
                limit: pagination.itemsPerPage,
                offset: pagination.offset,
            }
        );
        
        return collection;
    }
    
}

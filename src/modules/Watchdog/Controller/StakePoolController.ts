import { CrudController } from '#/BackendCore/Controller/CrudController';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import { Assert } from '@inti5/validator/Method';
import * as ORM from '@mikro-orm/core';



export class StakePoolController
    extends CrudController<StakePool>
{
    
    protected static readonly ENTITY = StakePool;
    
    
    @API.CRUD.GetCollection(() => StakePool, { path: '#PATH#/find/:term' })
    public async getStakePoolsByTerm (
        @Router.Param('term')
        @Assert({ type: 'string' })
            term : string
    ) : Promise<Api.Domain.Collection<StakePool>>
    {
        const stakePoolRepository = this._entityManager.getRepository(StakePool);
        
        const filters : ORM.FilterQuery<StakePool> = {
            $or: [
                { onChainId: { $like: `%${term}%` } },
                { owner: { identity: { $like: `%${term}%` } } }
            ]
        };
        
        const total = await stakePoolRepository.count(filters);
        const items = await stakePoolRepository.find(
            filters,
            {
                orderBy: { onChainId: 'ASC' },
                limit: 25,
                offset: 0,
            }
        );
        
        await stakePoolRepository.populate(items, [ 'owner' ]);
        
        return { items, total };
    }
    
}

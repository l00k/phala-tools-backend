import { CrudController } from '#/BackendCore/Controller/CrudController';
import { StakePool } from '#/Phala/Domain/Model';
import * as Api from '@inti5/api-backend';
import { API } from '@inti5/api-backend';
import * as Router from '@inti5/express-router';
import { Assert } from '@inti5/validator/Method';
import * as ORM from '@mikro-orm/core';


@Router.Headers.CacheControl('public, max-age=900')
export class StakePoolController
    extends CrudController<StakePool>
{
    
    protected static readonly ENTITY = StakePool;
    
    
    @API.CRUD.GetCollection(() => StakePool, { path: '#PATH#/find/:term' })
    @API.Serialize<Api.Domain.Collection<StakePool>>({
        items: {
            onChainId: true,
            owner: '*'
        },
        total: true,
    })
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

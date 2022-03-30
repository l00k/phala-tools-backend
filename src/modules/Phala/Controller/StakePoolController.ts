import { CrudController } from '#/BackendCore/Controller/CrudController';
import { WatchdogStakePool } from '#/Watchdog/Domain/Model/WatchdogStakePool';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import { Assert } from '@inti5/validator/Method';
import * as ORM from '@mikro-orm/core';



export class StakePoolController
    extends CrudController<WatchdogStakePool>
{
    
    protected static readonly ENTITY = WatchdogStakePool;
    
    
    @API.CRUD.GetCollection(() => WatchdogStakePool, { path: '#PATH#/find/:term' })
    public async getStakePoolsByTerm (
        @Router.Param('term')
        @Assert({ type: 'string' })
            term : string
    ) : Promise<Api.Domain.Collection<WatchdogStakePool>>
    {
        const stakePoolRepository = this._entityManager.getRepository(WatchdogStakePool);
        
        const filters : ORM.FilterQuery<WatchdogStakePool> = {
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

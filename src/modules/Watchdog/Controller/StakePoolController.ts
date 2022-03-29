import { CrudController } from '#/BackendCore/Controller/CrudController';
import { ApiProvider } from '#/Phala';
import * as Polkadot from '#/Polkadot';
import { Account } from '#/Watchdog/Domain/Model/Account';
import { StakePool } from '#/Watchdog/Domain/Model/StakePool';
import { PhalaEntityFetcher } from '#/Watchdog/Service/PhalaEntityFetcher';
import { Annotation as API } from '@inti5/api-backend';
import { Inject } from '@inti5/object-manager';
import { Assert } from '@inti5/validator/Method';
import * as ORM from '@mikro-orm/core';
import * as PolkadotUtils from '@polkadot/util';
import * as Router from '@inti5/express-ext';
import * as Api from '@inti5/api-backend';
import { addedDiff } from 'deep-object-diff';
import isNumeric from 'lodash';



export class StakePoolController
    extends CrudController<StakePool>
{
    
    protected static readonly ENTITY = StakePool;
    
    @Inject()
    protected _phalaEntityFetcher : PhalaEntityFetcher;
    
    
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
        
        if (
            !total
            && isNumeric(term)
        ) {
            // try to create new stake pool
            const stakePool = await this._phalaEntityFetcher.getOrCreateStakePool(Number(term));
            if (stakePool) {
                return {
                    total: 1,
                    items: [ stakePool ],
                }
            }
            else {
                return { total: 0, items: [] };
            }
        }
        else {
            const items = await stakePoolRepository.find(
                filters,
                {
                    populate: [ 'owner' ],
                    orderBy: { onChainId: 'ASC' },
                    limit: 25,
                    offset: 0,
                }
            );
            
            return { items, total };
        }
    }
    
}

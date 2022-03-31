import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Filters } from '#/Stats/Controller/StakePoolDto/Filters';
import { Modifiers } from '#/Stats/Controller/StakePoolDto/Modifiers';
import { StatsStakePool } from '#/Stats/Domain/Model/StatsStakePool';
import { Issue } from '#/Stats/Domain/Model/StakePool/Issue';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import * as ORM from '@mikro-orm/core';
import * as Trans from 'class-transformer';
import { Annotation as Srl } from 'core/serializer';


export class StakePoolController
    extends CrudController<StatsStakePool>
{
    
    protected static readonly ENTITY = StatsStakePool;
    
    @API.CRUD.GetItem(() => StatsStakePool)
    @Srl.Serialize<StatsStakePool>({
        special: true,
        onChainId: true,
        owner: '*',
        lastHistoryEntry: '*',
        issues: '*',
    })
    public async getStakePool (
        @Router.Param.Id()
            id : number
    ) : Promise<StatsStakePool>
    {
        return super.getItem(
            id,
            [
                'owner',
                'owner.tags',
                'issues',
            ]
        );
    }
    
    @API.CRUD.GetCollection(() => StatsStakePool)
    @Srl.Serialize<Api.Domain.Collection<StatsStakePool>>({
        items: {
            special: true,
            onChainId: true,
            owner: '*',
            lastHistoryEntry: '*',
            issues: '*',
        },
        total: true,
    })
    public async getStakePoolsCollection (
        @API.Filters(() => StatsStakePool, Filters)
            filters : Api.Domain.Filters<StatsStakePool>,
        @API.Sorting(() => StatsStakePool)
            sorting : Api.Domain.Sorting<StatsStakePool>,
        @API.Pagination()
            pagination : Api.Domain.Pagination,
        @API.Modifiers(Modifiers)
            modifiers : Modifiers
    ) : Promise<Api.Domain.Collection<StatsStakePool>>
    {
        const finalFilters : any = {
            $and: [
                { onChainId: { $ne: null } },
                filters.toQueryFilters(),
            ]
        };
        
        // build query and fetch collection
        const collection : Api.Domain.Collection<StatsStakePool> = {
            items: [],
            total: 0,
        };
        
        const queryFilters : ORM.FilterQuery<StatsStakePool> = Trans.instanceToPlain(finalFilters);
        const querySorting : ORM.QueryOrderMap = Trans.instanceToPlain(sorting);
        
        const qb = this._repository.createQueryBuilder('m');
        qb.select('*');
        qb.leftJoin('owner', 'o');
        qb.leftJoin('o.tags', 't');
        qb.leftJoin('issues', 'i');
        qb.where(queryFilters);
        qb.orderBy(querySorting);
        
        const qbCount = qb.clone();
        
        if (modifiers.distinctOwners) {
            qb.groupBy('o.id');
            
            const countResult = await qbCount.count('o.id', true).execute('get', false);
            collection.total = countResult.count;
        }
        else {
            qb.groupBy('m.id');
            
            const countResult = await qbCount.count('m.id').execute('get', false);
            collection.total = countResult.count;
        }
        
        qb.limit(pagination.itemsPerPage, pagination.offset);
        
        collection.items = await qb.getResult();
        
        await this._entityManager.populate(collection.items, [
            'owner',
            'owner.tags',
            'issues',
        ]);
        
        return collection;
    }
    
}

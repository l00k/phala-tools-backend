import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Filters } from '#/Stats/Controller/StakePoolDto/Filters';
import { Modifiers } from '#/Stats/Controller/StakePoolDto/Modifiers';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import * as ORM from '@mikro-orm/core';
import * as Trans from 'class-transformer';


export class StakePoolEntryController
    extends CrudController<StakePoolEntry>
{
    
    protected static readonly ENTITY = StakePoolEntry;
    
    @API.CRUD.GetItem(() => StakePoolEntry)
    @API.Serialize<StakePoolEntry>({
        special: true,
        stakePool: {
            $default: true,
            owner: '*',
        },
        lastHistoryEntry: '*',
        issues: '*',
    })
    public async getStakePool (
        @Router.Param.Id()
            id : number
    ) : Promise<StakePoolEntry>
    {
        return super.getItem(
            id,
            [
                'stakePool.owner',
                'issues',
            ]
        );
    }
    
    @API.CRUD.GetCollection(() => StakePoolEntry)
    @API.Serialize<Api.Domain.Collection<StakePoolEntry>>({
        items: {
            special: true,
            stakePool: {
                $default: true,
                owner: '*',
            },
            lastHistoryEntry: '*',
            issues: true,
        },
        total: true,
    })
    public async getStakePoolsCollection (
        @API.Filters(() => StakePoolEntry, Filters)
            filters : Api.Domain.Filters<StakePoolEntry>,
        @API.Sorting(() => StakePoolEntry)
            sorting : Api.Domain.Sorting<StakePoolEntry>,
        @API.Pagination()
            pagination : Api.Domain.Pagination,
        @API.Modifiers(Modifiers)
            modifiers : Modifiers
    ) : Promise<Api.Domain.Collection<StakePoolEntry>>
    {
        const finalFilters : any = {
            $and: [
                { stakePool: { $ne: null } },
                filters.toQueryFilters(),
            ]
        };
        
        // build query and fetch collection
        const collection : Api.Domain.Collection<StakePoolEntry> = {
            items: [],
            total: 0,
        };
        
        const queryFilters : ORM.FilterQuery<StakePoolEntry> = Trans.instanceToPlain(finalFilters);
        const querySorting : ORM.QueryOrderMap = Trans.instanceToPlain(sorting);
        
        const qb = this._repository.createQueryBuilder('m');
        qb.select('*');
        qb.leftJoin('m.stakePool.owner', 'o');
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
            'stakePool.owner',
            'issues',
        ]);
        
        return collection;
    }
    
}

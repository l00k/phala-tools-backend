import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Modifiers } from '#/Stats/Controller/StakePoolDto/Modifiers';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import * as Api from '@inti5/api-backend';
import { API } from '@inti5/api-backend';
import * as Router from '@inti5/express-router';


@Router.Headers.CacheControl('public, max-age=900')
export class StakePoolEntryController<P extends string = never>
    extends CrudController<StakePoolEntry>
{
    
    protected static readonly ENTITY = StakePoolEntry;
    
    @API.CRUD.GetItem(() => StakePoolEntry)
    @API.Serialize<StakePoolEntry>({
        special: true,
        stakePool: {
            onChainId: true,
            owner: {
                address: true,
                identity: true,
                identityVerified: true,
            }
        },
        lastHistoryEntry: {
            snapshot: {
                date: true,
            },
            intermediateStep: true,
            commission: true,
            workersNum: true,
            workersActiveNum: true,
            stakeTotal: true,
            cap: true,
            stakeFree: true,
            stakeReleasing: true,
            stakeRemaining: true,
            withdrawals: true,
            currentApr: true,
            avgApr: true,
        },
        issues: true
    })
    public async getStakePool (
        @Router.Param.Id()
            id : number
    ) : Promise<StakePoolEntry>
    {
        return super._getItem(
            id,
            <any>[
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
                onChainId: true,
                owner: {
                    address: true,
                    identity: true,
                    identityVerified: true,
                }
            },
            lastHistoryEntry: {
                snapshot: {
                    date: true,
                },
                intermediateStep: true,
                commission: true,
                workersNum: true,
                workersActiveNum: true,
                stakeTotal: true,
                cap: true,
                stakeFree: true,
                stakeReleasing: true,
                stakeRemaining: true,
                withdrawals: true,
                currentApr: true,
                avgApr: true,
            },
            issues: true,
        },
        total: true,
    })
    public async getStakePoolsCollection (
        @API.Filters(() => StakePoolEntry)
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
        
        console.dir(finalFilters, { depth: 10 });
        
        // build query and fetch collection
        const collection : Api.Domain.Collection<StakePoolEntry> = {
            items: [],
            total: 0,
        };
        
        const qb = this._repository.createQueryBuilder('m');
        qb.select('*');
        qb.leftJoin('m.issues', 'i');
        qb.leftJoin('m.stakePool', 's');
        qb.leftJoin('s.owner', 'o');
        
        qb.where(finalFilters);
        qb.orderBy(sorting.toOrderByMap());
        
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

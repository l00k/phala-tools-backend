import { CrudController } from '#/BackendCore/Controller/CrudController';
import { StakePool } from '#/Stats/Domain/Model/StakePool';
import { HistoryEntry } from '#/Stats/Domain/Model/StakePool/HistoryEntry';
import * as Api from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { Annotation as API } from '@inti5/api-backend';


export class StakePoolHistoryEntryController
    extends CrudController<HistoryEntry>
{
    
    protected static readonly ENTITY = HistoryEntry;
    
    @API.CRUD.GetCollection(
        () => HistoryEntry,
        'stake_pool/:id/history'
    )
    public async getStakePoolHistoryCollection (
        @API.Param.Id()
            id : number,
        @API.Pagination([ 200 ])
            pagination : Api.Domain.Pagination
    ) : Promise<Api.Domain.Collection<HistoryEntry>>
    {
        return super.getCollection(
            {
                stakePool: { id: { $eq: id } }
            },
            { entryNonce: ORM.QueryOrder.DESC },
            pagination
        );
    }
    
}

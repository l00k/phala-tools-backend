import { CrudController } from '#/BackendCore/Controller/CrudController';
import { HistoryEntry } from '#/Stats/Domain/Model/StakePool/HistoryEntry';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import * as ORM from '@mikro-orm/core';


export class StakePoolHistoryEntryController
    extends CrudController<HistoryEntry>
{
    
    protected static readonly ENTITY = HistoryEntry;
    
    @API.CRUD.GetCollection(
        () => HistoryEntry,
        { path: 'stake_pool/:id/history' }
    )
    public async getStakePoolHistoryCollection (
        @Router.Param.Id()
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

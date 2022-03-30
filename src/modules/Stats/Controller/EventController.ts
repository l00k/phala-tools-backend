import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Event } from '#/Stats/Domain/Model/Event';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';


export class StakePoolHistoryEntryController
    extends CrudController<Event<any>>
{
    
    protected static readonly ENTITY = Event;
    
    @API.CRUD.GetCollection(
        () => Event,
        { path: 'stake_pool/:id/events' }
    )
    public async getStakePoolHistoryCollection (
        @Router.Param.Id()
            id : number,
        @API.Filters(() => Event)
            filters : Api.Domain.Filters<Event<any>>,
        @API.Pagination([ 200 ])
            pagination : Api.Domain.Pagination
    ) : Promise<Api.Domain.Collection<Event<any>>>
    {
        const finalFilters : any = {
            $and: [
                {
                    $or: [
                        { stakePool: { id: { $eq: id } } },
                    ]
                },
                filters.toQueryFilters(),
            ]
        };
        
        return super.getCollection(
            finalFilters,
            {},
            pagination
        );
    }
    
}

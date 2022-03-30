import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Event } from '#/Stats/Domain/Model/Event';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';


export class StakePoolHistoryEntryController
    extends CrudController<Event<any>>
{
    
    protected static readonly ENTITY = Event;
    
    @API.CRUD.GetCollection(
        () => Event,
        'stake_pool/:id/events'
    )
    public async getStakePoolHistoryCollection (
        @API.Param.Id()
            id : number,
        @API.Filters(() => Event)
            filters : Api.Domain.Filters<Event<any>>,
        @API.Pagination([ 200 ])
            pagination : Api.Domain.Pagination
    ) : Promise<Api.Domain.Collection<Event<any>>>
    {
        const finalFilters : Api.Domain.Filters<Event<any>> = {
            $and: [
                {
                    $or: [
                        { stakePool: { id: { $eq: id } } },
                        { stakePool: null },
                    ]
                },
                filters,
            ]
        };
        
        return super.getCollection(
            finalFilters,
            {},
            pagination
        );
    }
    
}

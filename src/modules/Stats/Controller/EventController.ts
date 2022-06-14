import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Event } from '#/Stats/Domain/Model/Event';
import * as Api from '@inti5/api-backend';
import { API } from '@inti5/api-backend';
import * as Router from '@inti5/express-router';


@Router.Headers.CacheControl('public, max-age=900')
export class EventController
    extends CrudController<Event<any>>
{
    
    protected static readonly ENTITY = Event;
    
    @API.CRUD.GetCollection(
        () => Event,
        { path: '#PATH#/by_stakepool/:id' }
    )
    @API.Serialize<Api.Domain.Collection<Event>>({
        items: '**',
        total: true,
    })
    public async getEventsCollection (
        @Router.Param.Id()
            id : number,
        @API.Filters(() => Event)
            filters : Api.Domain.Filters<Event>,
        @API.Pagination([ 200 ])
            pagination : Api.Domain.Pagination
    ) : Promise<Api.Domain.Collection<Event>>
    {
        const finalFilters : any = {
            $and: [
                {
                    $or: [
                        { stakePoolEntry: { id } },
                        { stakePoolEntry: null },
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

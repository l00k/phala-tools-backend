import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Event } from '#/Stats/Domain/Model/Event';
import { HistoryEntry } from '#/Stats/Domain/Model/HistoryEntry';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import { Annotation as Srl } from '@inti5/serializer';


export class EventController
    extends CrudController<Event<any>>
{
    
    protected static readonly ENTITY = Event;
    
    @API.CRUD.GetCollection(
        () => Event,
        { path: '#PATH#/by_stakepool/:id' }
    )
    @Srl.Serialize<Api.Domain.Collection<Event>>({
        items: '**',
        total: true,
    })
    public async getStakePoolHistoryCollection (
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

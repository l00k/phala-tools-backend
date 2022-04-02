import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Event } from '#/Stats/Domain/Model/Event';
import { Issue } from '#/Stats/Domain/Model/Issue';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';
import { Annotation as Srl } from '@inti5/serializer';


export class IssueController
    extends CrudController<Issue>
{
    
    protected static readonly ENTITY = Issue;
    
    @API.CRUD.GetCollection(() => Issue)
    @Srl.Serialize<Api.Domain.Collection<Issue>>({
        items: '*',
        total: true,
    })
    public async getCollection () : Promise<Api.Domain.Collection<Issue>>
    {
        const pagination = new Api.Domain.Pagination();
        pagination.itemsPerPage = 10000;
        
        return super.getCollection({}, {}, pagination);
    }
    
}

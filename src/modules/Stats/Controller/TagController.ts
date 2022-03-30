import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Tag } from '#/Stats/Domain/Model/Tag';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';


export class TagController
    extends CrudController<Tag>
{
    
    protected static readonly ENTITY = Tag;
    
    @API.CRUD.GetCollection(() => Tag)
    public async getCollection () : Promise<Api.Domain.Collection<Tag>>
    {
        const pagination = new Api.Domain.Pagination();
        pagination.itemsPerPage = 10000;
        
        return super.getCollection({}, {}, pagination);
    }
    
}

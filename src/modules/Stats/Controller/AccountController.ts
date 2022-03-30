import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Account } from '#/Stats/Domain/Model/Account';
import * as Api from '@inti5/api-backend';
import { Annotation as API } from '@inti5/api-backend';


export class StakePoolController
    extends CrudController<Account>
{

    protected static readonly ENTITY = Account;
    
    @API.CRUD.GetCollection(() => Account)
    public async getCollection (
        @API.Filters(() => Account)
            filters : Api.Domain.Filters<Account>,
        @API.Sorting(() => Account)
            sorting : Api.Domain.Sorting<Account>,
        @API.Pagination()
            pagination : Api.Domain.Pagination
    ) : Promise<Api.Domain.Collection<Account>>
    {
        return super.getCollection(filters, sorting, pagination, [ 'tags' ]);
    }
    
}

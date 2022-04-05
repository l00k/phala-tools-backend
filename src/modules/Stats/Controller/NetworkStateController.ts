import { CrudController } from '#/BackendCore/Controller/CrudController';
import { NetworkState } from '#/Stats/Domain/Model/NetworkState';
import { Annotation as API } from '@inti5/api-backend';


export class NetworkStateController
    extends CrudController<NetworkState>
{
    
    protected static readonly ENTITY = NetworkState;
    
    @API.CRUD.GetItem(() => NetworkState, { path: '#PATH#/latest' })
    @API.Serialize<NetworkState>('*')
    public async getLatest () : Promise<NetworkState>
    {
        return this._repository.findOne({
            entryNonce: { $gte: 0 }
        }, {
            orderBy: {
                entryNonce: 'DESC'
            },
        });
    }
    
}

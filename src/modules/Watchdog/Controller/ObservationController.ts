import { CrudController } from '#/BackendCore/Controller/CrudController';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import { Assert } from '@inti5/validator/Method';


export class ObservationController
    extends CrudController<Observation>
{
    
    protected static readonly ENTITY = Observation;
    
    
    @API.CRUD.Create(() => Observation)
    @API.Serialize({
        $default: true
    }, () => Observation)
    @Router.AuthOnly()
    public async create (
        @Router.AuthData()
            authData : any,
        @Router.Body()
        @API.Deserialize({
            stakePool: true,
            account: true,
            mode: true,
            config: '**',
            lastNotifications: false,
        }, () => Observation)
        @Assert()
            observation : Observation
    ) : Promise<Observation>
    {
        console.log('CREATE', observation);
        
        return null;
    }
    
    @API.CRUD.Update(() => Observation)
    @API.Serialize({
        $default: true
    }, () => Observation)
    @Router.AuthOnly()
    public async update (
        @Router.AuthData()
            authData : any,
        @Router.Param.Id()
            id : number,
        @Router.Body()
        @API.Deserialize({
            stakePool: true,
            account: true,
            mode: true,
            config: '**',
            lastNotifications: false,
        }, () => Observation)
        @Assert()
            observation : Observation
    ) : Promise<Observation>
    {
        console.log('UPDATE', id, observation);
        
        return null;
    }
    
    @API.CRUD.Delete(() => Observation)
    @Router.AuthOnly()
    public async delete (
        @Router.AuthData()
            authData : any,
        @Router.Param.Id()
            id : number
    ) : Promise<boolean>
    {
        console.log('DELETE', id);
        
        return null;
    }
    
}

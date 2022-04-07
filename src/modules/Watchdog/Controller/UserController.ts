import { CrudController } from '#/BackendCore/Controller/CrudController';
import { User } from '#/Watchdog/Domain/Model/User';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import { Assert } from '@inti5/validator/Method';
import { Annotation as Srl } from '@inti5/serializer';


@Router.AuthOnly()
export class UserController
    extends CrudController<User>
{
    
    protected static readonly ENTITY = User;
    
    
    @API.CRUD.GetItem(() => User, { path: '#PATH#/me' })
    @API.Serialize({
        msgChannel: true,
        username: true,
        config: '*',
        observations: {
            stakePool: {
                onChainId: true,
                owner: '*',
            },
            account: '*',
            mode: true,
            config: '*',
            lastNotifications: '*',
        }
    }, () => User)
    public async getUserMe (
        @Router.AuthData()
            authData : any
    ) : Promise<User>
    {
        return this.getItem(
            authData.userId,
            [ 'observations', 'observations.stakePool.owner' ]
        );
    }
    
}

import { CrudController } from '#/BackendCore/Controller/CrudController';
import { User } from '#/Watchdog/Domain/Model/User';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import { Assert } from 'core/validator/Method';
import rateLimit from 'express-rate-limit';


@Router.AuthOnly()
export class UserController
    extends CrudController<User>
{
    
    protected static readonly ENTITY = User;
    
    
    @Router.Endpoint.GET('/user/me', {
        middlewares: [
            rateLimit({ windowMs: 15 * 1000, max: 1 })
        ]
    })
    @API.Endpoint(() => User)
    public async getUserMe (
        @Router.AuthData()
            authData : any
    ) : Promise<User>
    {
        return this.getItem(authData.userId, [ 'stakePoolObservations' ]);
    }
    
    
    @Router.Endpoint.POST('/user/me', {
        middlewares: [
            rateLimit({ windowMs: 15 * 1000, max: 1 })
        ]
    })
    @API.Endpoint(() => User)
    public async postUserMe (
        @Router.AuthData()
            authData : any,
        @Router.Body()
        @Assert()
            user : User
    ) : Promise<User>
    {
        const entityManager = this._entityManagerWrapper.getDirectEntityManager();
        const userRepository = entityManager.getRepository(User);
        
        
        console.log(user);
        
        return user;
    }
    
}

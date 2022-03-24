import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { User } from '#/Watchdog/Domain/Model/User';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import rateLimit from 'express-rate-limit';


@Router.AuthOnly()
export class UserController
    extends Router.Controller
{
    
    @Inject({ ctorArgs: [ UserController.name ] })
    protected logger : Logger;
    
    @Inject()
    protected entityManagerWrapper : EntityManagerWrapper;
    
    
    @Router.Endpoint.GET('/user/me', {
        middlewares: [
            rateLimit({ windowMs: 15 * 1000, max: 1 })
        ]
    })
    @API.Endpoint(() => User)
    public async getUserMe (
        @Router.AuthData()
            authData : any
    )
    {
        const entityManager = this.entityManagerWrapper.getDirectEntityManager();
        const userRepository = entityManager.getRepository(User);
        
        return await userRepository.findOne(
            { id: authData.userId },
            [ 'stakePoolObservations' ]
        );
    }
    
}

import { EntityManagerWrapper } from '#/Core/Service/EntityManagerWrapper';
import { DiscordDto } from '#/Watchdog/Controller/Login/DiscordDto';
import { NodeState } from '#/Watchdog/Domain/Model/MetricState/NodeState';
import { Controller, Endpoint, Query } from '@inti5/express-ext';
import { Inject } from '@inti5/object-manager';
import { Assert } from '@inti5/validator/Method';
import rateLimit from 'express-rate-limit';


export class LoginController
    extends Controller
{
    
    @Inject()
    protected entityManagerWrapper : EntityManagerWrapper;
    
    
    @Endpoint.POST('/login/discord', {
        middlewares: [
            rateLimit({ windowMs: 15 * 1000, max: 1 })
        ]
    })
    public async index (
        @Query()
        @Assert({ presence: true })
            query : DiscordDto
    )
    {
        const entityManager = this.entityManagerWrapper.getDirectEntityManager();
        const nodeStateRepository = entityManager.getRepository(NodeState);
        
        console.log(query);
        
        return true;
    }
    
}

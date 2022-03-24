import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { UpdateDto } from '#/Watchdog/Controller/NodeState/UpdateDto';
import { NodeState } from '#/Watchdog/Domain/Model/MetricState/NodeState';
import { ActionResult, Controller, Endpoint } from '@inti5/express-ext';
import { Body } from '@inti5/express-ext/Annotation/Body';
import { InitializeSymbol, Inject } from '@inti5/object-manager';
import { Assert, Validate } from '@inti5/validator/Method';
import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import rateLimit from 'express-rate-limit';

export class NodeStateController
    extends Controller
{
    
    @Inject()
    protected entityManagerWrapper : EntityManagerWrapper;
    
    protected entityManager : EntityManager;
    
    protected nodeStateRepository : EntityRepository<NodeState>;
    
    
    public async [InitializeSymbol] ()
    {
        this.entityManager = this.entityManagerWrapper.getDirectEntityManager();
        this.nodeStateRepository = this.entityManager.getRepository(NodeState);
    }
    
    @Endpoint.POST('/node-state', {
        middlewares: [
            rateLimit({ windowMs: 5 * 60 * 1000, max: 5 })
        ]
    })
    public async index (
        @Body()
        @Assert({ presence: true })
        nodeStateUpdateDto : UpdateDto
    )
    {
        const nodeState = await this.nodeStateRepository.findOne({ nodeKey: nodeStateUpdateDto.nodeKey });
        if (!nodeState) {
            throw new ActionResult({ code: 404 });
        }
        
        nodeState.assign(nodeStateUpdateDto, { onlyProperties: true });
        
        await this.entityManager.flush();
        
        return true;
    }
    
}

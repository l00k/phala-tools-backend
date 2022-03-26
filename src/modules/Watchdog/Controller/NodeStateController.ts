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
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    protected _entityManager : EntityManager;
    
    protected _nodeStateRepository : EntityRepository<NodeState>;
    
    
    public async [InitializeSymbol] ()
    {
        this._entityManager = this._entityManagerWrapper.getDirectEntityManager();
        this._nodeStateRepository = this._entityManager.getRepository(NodeState);
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
        const nodeState = await this._nodeStateRepository.findOne({ nodeKey: nodeStateUpdateDto.nodeKey });
        if (!nodeState) {
            throw new ActionResult({ code: 404 });
        }
        
        nodeState.assign(nodeStateUpdateDto, { onlyProperties: true });
        
        await this._entityManager.flush();
        
        return true;
    }
    
}

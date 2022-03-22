import { EntityManagerWrapper } from '#/AppBackend/Service/EntityManagerWrapper';
import { AbstractHandler } from '#/AppBackend/Service/Tasker/AbstractHandler';
import { Task } from '#/AppBackend/Service/Tasker/Annotation';
import { NotificationAggregator } from '#/Messaging/Service/NotificationAggregator';
import { AbstractIssue } from '#/Watchdog/Domain/Model/AbstractIssue';
import { NodeIssue } from '#/Watchdog/Domain/Model/Issue/NodeIssue';
import { NodeState } from '#/Watchdog/Domain/Model/MetricState/NodeState';
import { NodeStateVerificator } from '#/Watchdog/Service/NodeStateVerificator';
import { Inject, Injectable } from '@inti5/object-manager';
import { EntityManager } from '@mikro-orm/core';
import { SqlEntityRepository } from '@mikro-orm/mysql';


@Injectable({ tag: 'tasker.handler' })
export class NodeIssuesHandler
    extends AbstractHandler
{
    
    protected static readonly ISSUE_CLASS : typeof AbstractIssue = NodeIssue;
    
    
    @Inject({ ctorArgs: [ '🚨 Node has a problem' ] })
    protected notificationAggregator : NotificationAggregator;
    
    @Inject()
    protected nodeStateVerficator : NodeStateVerificator;
    
    @Inject()
    protected entityManagerWrapper : EntityManagerWrapper;
    
    protected entityManager : EntityManager;
    
    protected nodeStateRepository : SqlEntityRepository<NodeState>;
    
    
    public async init ()
    {
        this.entityManager = this.entityManagerWrapper.getDirectEntityManager();
        this.nodeStateRepository = this.entityManager.getRepository(NodeState);
    }
    
    @Task({
        cronExpr: '*/15 * * * *'
    })
    public async handle () : Promise<boolean>
    {
        const nodeStates : NodeState[] = await this.nodeStateRepository.find({
            owner: { $ne: null }
        });
        
        for (const nodeState of nodeStates) {
            const verification = await this.nodeStateVerficator.verify(nodeState);
            
            if (!verification.valid) {
                const text = '*' + nodeState.name + '*\n'
                    + verification.issues.join('\n');
                
                this.notificationAggregator.aggregate(
                    nodeState.owner.msgChannel,
                    nodeState.owner.msgUserId,
                    text
                );
            }
        }
        
        return true;
    }
    
    public async postProcess ()
    {
        await this.notificationAggregator.send();
    }
    
}

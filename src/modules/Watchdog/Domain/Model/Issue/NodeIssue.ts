import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AbstractIssue } from '#/Watchdog/Domain/Model/AbstractIssue';
import { NodeState } from '#/Watchdog/Domain/Model/MetricState/NodeState';



@ORM.Entity({
    tableName: 'watchdog_issue_node'
})
export class NodeIssue
    extends AbstractIssue<NodeIssue>
{
    
    public static readonly REMINDER_DELAY : number = 15;
    
    
    @ORM.OneToOne(() => NodeState)
    public nodeState : NodeState;
    
    
    public constructor (data? : Partial<NodeIssue>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

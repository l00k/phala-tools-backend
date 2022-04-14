import * as ORM from '@mikro-orm/core';
import { AbstractIssue } from '#/Watchdog/Domain/Model/AbstractIssue';
import { NodeState } from '#/Watchdog/Domain/Model/MetricState/NodeState';



@ORM.Entity({
    tableName: 'watchdog_issue_stucked_node'
})
export class StuckedNode
    extends AbstractIssue<StuckedNode>
{
    
    @ORM.OneToOne(() => NodeState)
    public nodeState : NodeState;
    
    
    public constructor (data? : Partial<StuckedNode>, entityManager? : ORM.EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

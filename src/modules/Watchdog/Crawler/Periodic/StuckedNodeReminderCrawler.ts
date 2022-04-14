import { NodeState } from '#/Watchdog/Domain/Model/MetricState/NodeState';
import { NodeStateVerificator } from '#/Watchdog/Service/NodeStateVerificator';
import { AbstractPeriodicCrawler } from '#/Watchdog/Service/AbstractPeriodicCrawler';
import { Inject } from '@inti5/object-manager';


export class StuckedNodeReminderCrawler
    extends AbstractPeriodicCrawler
{
    
    @Inject()
    protected _nodeStateVerficator : NodeStateVerificator;
    
    protected readonly _messageTitle : string = '🚨 Node has a problem';
    
    
    protected async _handle () : Promise<boolean>
    {
        const nodeStateRepository = this._entityManager.getRepository(NodeState);
        const nodeStates : NodeState[] = await nodeStateRepository.find({
            owner: { $ne: null }
        });
        
        for (const nodeState of nodeStates) {
            const verification = await this._nodeStateVerficator.verify(nodeState);
            
            if (!verification.valid) {
                const text = '*' + nodeState.name + '*\n'
                    + verification.issues.join('\n');
                
                this._notificationAggregator.aggregate(
                    nodeState.owner.msgChannel,
                    nodeState.owner.msgUserId,
                    text
                );
            }
        }
        
        return true;
    }
    
}

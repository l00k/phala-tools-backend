import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { InitializeSymbol, Inject } from '@inti5/object-manager';
import { NodeState } from '#/Watchdog/Domain/Model/MetricState/NodeState';
import { EntityManager, SqlEntityRepository } from '@mikro-orm/mysql';
import moment from 'moment';
import { Exception } from '@inti5/utils/Exception';
import { RuntimeCache } from '@inti5/cache/RuntimeCache';


class VerificationResult
{
    public valid : boolean = true;
    public issues : string[] = [];
}


export class NodeStateVerificator
{
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _runtimeCache : RuntimeCache;
    
    protected _entityManager : EntityManager;
    
    protected _nodeStateRepository : SqlEntityRepository<NodeState>;
    
    
    public [InitializeSymbol]()
    {
        this._entityManager = this._entityManagerWrapper.getCommonEntityManager();
        this._nodeStateRepository = this._entityManager.getRepository(NodeState);
    }
    
    public getBest(): Promise<NodeState>
    {
        return this._runtimeCache.get('bestNode', async() => {
            const dateThreshold : Date = moment.utc().subtract(15, 'minute').toDate();
        
            this._entityManager.clear();
            
            const activePrimaryNodes = await this._nodeStateRepository.find({
                primary: true
            });
            
            const bestNode = new NodeState({
                name: 'Best',
                primary: true,
                isVirtual: true,
            });
            
            bestNode.relayChain.finalizedBlock = Math.max(...activePrimaryNodes.map(n => n.relayChain.finalizedBlock));
            bestNode.relayChain.highestBlock = Math.max(...activePrimaryNodes.map(n => n.relayChain.highestBlock));
            
            bestNode.paraChain.finalizedBlock = Math.max(...activePrimaryNodes.map(n => n.paraChain.finalizedBlock));
            bestNode.paraChain.highestBlock = Math.max(...activePrimaryNodes.map(n => n.paraChain.highestBlock));
            
            return bestNode;
        }, { lifetime: 60 });
    }
    
    public async verify(nodeState : NodeState): Promise<VerificationResult>
    {
        const bestNode = await this.getBest();
        
        // compare with avg primary node
        const result = new VerificationResult();
        
        {
            const delta = moment.utc().diff(nodeState.lastUpdate, 'minutes');
            if (delta > NodeState.HEARTBEAT_WINDOW) {
                result.issues.push(`No heartbeat for over ${NodeState.HEARTBEAT_WINDOW} minutes`);
            }
        }
        {
            const delta = bestNode.relayChain.finalizedBlock - nodeState.relayChain.finalizedBlock;
            if (delta > NodeState.STUCK_OFFSET_THRESHOLD) {
                result.issues.push(`Relaychain possible stuck - finalized block offset ${delta}`);
            }
        }
        {
            const delta = bestNode.relayChain.highestBlock - nodeState.relayChain.highestBlock;
            if (delta > NodeState.STUCK_OFFSET_THRESHOLD) {
                result.issues.push(`Relaychain possible stuck - highest block offset ${delta}`);
            }
        }
        
        {
            const delta = bestNode.paraChain.finalizedBlock - nodeState.paraChain.finalizedBlock;
            if (delta > NodeState.STUCK_OFFSET_THRESHOLD) {
                result.issues.push(`Parachain possible stuck - finalized block offset ${delta}`);
            }
        }
        {
            const delta = bestNode.paraChain.highestBlock - nodeState.paraChain.highestBlock;
            if (delta > NodeState.STUCK_OFFSET_THRESHOLD) {
                result.issues.push(`Parachain possible stuck - highest block offset ${delta}`);
            }
        }
        
        result.valid = result.issues.length == 0;
        
        return result;
    }
    
}

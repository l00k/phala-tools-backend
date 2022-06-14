import { Assert } from '@inti5/validator/Object';
import { NodeState } from '#/Watchdog/Domain/Model/MetricState/NodeState';
import { AssertOptions } from '@inti5/validator/Object/AssertOptions';


class ChainStateDto
{
    
    @Assert({
        presence: true,
        numericality: {
            onlyInteger: true,
            greaterThanOrEqualTo: 0,
        }
    })
    public peers : number;
    
    @Assert({
        presence: true,
        numericality: {
            onlyInteger: true,
            greaterThanOrEqualTo: 0,
        }
    })
    public highestBlock : number;
    
    @Assert({
        presence: true,
        numericality: {
            onlyInteger: true,
            greaterThanOrEqualTo: 0,
        }
    })
    public finalizedBlock : number;
    
};


export class UpdateDto
{
    
    @Assert({
        presence: true,
        format: /^[0-9a-zA-Z]+$/,
        length: { is: NodeState.NODE_KEY_LENGTH }
    })
    public nodeKey : string;
    
    @Assert({
        presence: true,
    })
    public relayChain : ChainStateDto;
    
    @Assert({
        presence: true,
    })
    public paraChain : ChainStateDto;
    
}

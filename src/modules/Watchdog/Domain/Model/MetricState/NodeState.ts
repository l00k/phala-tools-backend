import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AbstractModel } from '@inti5/app-backend/Module/AbstractModel';
import { User } from '#/Watchdog/Domain/Model/User';



type ChainState = {
    peers : number,
    highestBlock : number,
    finalizedBlock : number,
};


@ORM.Entity({
    tableName: 'watchdog_state_node'
})
export class NodeState
    extends AbstractModel<NodeState>
{

    public static readonly NODE_KEY_LENGTH = 32;

    public static readonly STUCK_OFFSET_THRESHOLD = 25; // blocks

    public static readonly HEARTBEAT_WINDOW = 15; // minutes


    @ORM.PrimaryKey()
    public id : number;

    public isVirtual : boolean = false;


    @ORM.Property({ unique: true })
    public nodeKey : string;

    @ORM.Property()
    public name : string;

    @ORM.Property()
    public primary : boolean = false;

    @ORM.ManyToOne(() => User, { nullable: true, eager: true })
    public owner : User;

    @ORM.Property({ type: ORM.JsonType })
    public relayChain : ChainState = {
        peers: 0,
        highestBlock: 0,
        finalizedBlock: 0,
    };

    @ORM.Property({ type: ORM.JsonType })
    public paraChain : ChainState = {
        peers: 0,
        highestBlock: 0,
        finalizedBlock: 0,
    };

    @ORM.Property({ onUpdate: () => new Date() })
    public lastUpdate : Date = new Date();


    public constructor (data? : Partial<NodeState>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}

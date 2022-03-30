import { ColumnType } from '#/App/Domain/DbConfig';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ExtORM from '#/BackendCore/ORM/Ext';
import { Account } from '#/Stats/Domain/Model/Account';
import { StakePool } from '#/Stats/Domain/Model/StakePool';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


export enum WorkerState
{
    NotReady = 'NotReady',
    Ready = 'Ready',
    MiningIdle = 'MiningIdle',
    MiningActive = 'MiningActive',
    MiningUnresponsive = 'MiningUnresponsive',
    MiningCoolingDown = 'MiningCoolingDown',
};

export const MiningStates : string[] = [
    WorkerState.MiningIdle,
    WorkerState.MiningActive,
];


@ORM.Entity({
    tableName: 'stats_worker'
})
export class Worker
    extends AbstractModel<Worker>
{
    
    protected static readonly CONFIDENCE_SCORE_MAP = {
        1: 1.0,
        2: 1.0,
        3: 1.0,
        4: 0.8,
        5: 0.7,
    };
    
    public static readonly MINING_STATES = [
        WorkerState.MiningIdle,
        WorkerState.MiningActive,
    ];
    
    
    @ORM.PrimaryKey()
    public id : number;
    
    
    @ORM.Property()
    public publicKey : string;
    
    @ORM.Property({ nullable: true })
    public bindingAccount : string;
    
    @ORM.ManyToOne(() => Account)
    public operator : Account;
    
    @ORM.ManyToOne(() => StakePool, { nullable: true })
    public stakePool : StakePool;
    
    @ORM.Property({ unsigned: true })
    public initialScore : number;
    
    @ORM.Property({ unsigned: true })
    public confidenceLevel : number;
    
    @ORM.Enum({ items: () => WorkerState })
    public state : WorkerState = WorkerState.NotReady;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.ENC_BIG_DECIMAL })
    public ve : number;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.ENC_BIG_DECIMAL })
    public v : number;
    
    @ORM.Property({ unsigned: true })
    public pInit : number;
    
    @ORM.Property({ unsigned: true })
    public pInstant : number;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    public totalRewards : number = 0;
    
    
    @ORM.Property({ onUpdate: () => new Date() })
    public updatedAt : Date = new Date();
    
    // runtime values
    public isDropped : boolean = true;
    
    
    public get confidenceScore () : number
    {
        return Worker.CONFIDENCE_SCORE_MAP[this.confidenceLevel];
    }
    
    public get isMiningState () : boolean
    {
        return Worker.MINING_STATES.includes(this.state);
    }
    
    public getShare () : number
    {
        return Math.sqrt(
            this.v ** 2
            + (this.pInstant * 2 * this.confidenceScore) ** 2
        );
    }
    
    
    public constructor (data? : Partial<Worker>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

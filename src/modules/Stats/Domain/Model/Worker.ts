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


export class Worker
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
    
    
    public publicKey : string;
    
    public initialScore : number;
    public confidenceLevel : number;
    
    public state : WorkerState = WorkerState.NotReady;
    
    public ve : number;
    public v : number;
    
    public pInit : number;
    public pInstant : number;
    
    
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
    
    
    public constructor (data? : Partial<Worker>)
    {
        if (data) {
            Object.assign(this, data);
        }
    }
    
}

export enum EventType
{
    WorkerEnterUnresponsive = 'phalaComputation::WorkerEnterUnresponsive',
    WorkerExitUnresponsive = 'phalaComputation::WorkerExitUnresponsive',
    PoolCommissionSet = 'phalaStakePoolv2::PoolCommissionSet',
};


export class Event
{
    
    public type : EventType;
    
    public blockNumber : number;
    
    public blockHash : string;
    
    public blockDate : Date;
    
    public data : any;
    
}

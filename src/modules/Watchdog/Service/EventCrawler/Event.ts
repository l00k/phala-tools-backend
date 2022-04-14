export enum EventType
{
    MinerEnterUnresponsive = 'phalaMining::MinerEnterUnresponsive',
    MinerExitUnresponsive = 'phalaMining::MinerExitUnresponsive',
    MinerSettled = 'phalaMining::MinerSettled',
    PoolCommissionSet = 'phalaStakePool::PoolCommissionSet',
    Contribution = 'phalaStakePool::Contribution',
    Withdrawal = 'phalaStakePool::Withdrawal',
};


export class Event
{
    
    public type : EventType;
    
    public blockNumber : number;
    
    public blockHash : string;
    
    public blockDate : Date;
    
    public data : any;
    
}

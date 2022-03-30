import { EventType } from '#/Stats/Domain/Model/Event';

export class OnChainEventsCrawlerState
{
    
    public static ID = 'ps/events';
    
    public [EventType.Transfer] : number = 0;
    
    // 2021-09-17 00:00:12
    public [EventType.PoolCreated] : number = 409472;
    public [EventType.CommissionChange] : number = 409472;
    public [EventType.Contribution] : number = 409472;
    public [EventType.Withdrawal] : number = 409472;
    public [EventType.Slash] : number = 409472;
    public [EventType.Halving] : number = 409472;
    
}

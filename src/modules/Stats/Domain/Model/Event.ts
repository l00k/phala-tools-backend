import { ColumnType } from '#/App/Domain/DbConfig';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ExtORM from '#/BackendCore/ORM/Ext';
import { Account } from '#/Phala/Domain/Model';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import { EventRepository } from '#/Stats/Domain/Repository/EventRepository';
import { API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { Type } from '@inti5/graph-typing';


export enum EventType
{
    Transfer = 'transfer',
    
    PoolCreated = 'poolCreated',
    CommissionChange = 'commissionChange',
    Contribution = 'contribution',
    Withdrawal = 'withdrawal',
    Slash = 'slash',
    Halving = 'halving',
    
    BadBehavior = 'badBehavior',
}



abstract class AbstractEventData {}

export class Transfer
    extends AbstractEventData {}

export class PoolCreated
    extends AbstractEventData {}

export class Contribution
    extends AbstractEventData {}

export class Withdrawal
    extends AbstractEventData {}

export class Slash
    extends AbstractEventData {}

export class Halving
    extends AbstractEventData {}

export class CommissionChange
    extends AbstractEventData
{
    public commission : number;
    public delta : number;
}


@API.Resource()
class EventAdditionalData
{
    
    @API.Property()
    public commission : number;
    
    @API.Property()
    public delta : number;
    
}


@ORM.Entity({
    tableName: 'stats_event',
    customRepository: () => EventRepository
})
@API.Resource('Stats/Event')
export class Event<T extends AbstractEventData = AbstractEventData>
    extends AbstractModel<Event<T>>
{
    
    [ORM.EntityRepositoryType]? : EventRepository<T>;
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    @ORM.Property({ index: true })
    @API.Property()
    public blockNumber : number;
    
    @ORM.Property()
    @API.Property()
    public blockDate : Date;
    
    
    @ORM.Property({ index: true })
    @ORM.Enum({ items: () => EventType })
    @API.Property()
    @API.Filterable()
    public type : EventType = null;
    
    
    @ORM.ManyToOne(() => StakePoolEntry, { nullable: true })
    public stakePoolEntry : StakePoolEntry;
    
    @ORM.ManyToOne(() => Account, { nullable: true })
    public sourceAccount : Account;
    
    @ORM.ManyToOne(() => Account, { nullable: true })
    public targetAccount : Account;
    
    @ORM.Property({ ...ColumnType.BALANCE, nullable: true })
    @API.Property()
    public amount : number = 0;
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property()
    @Type(() => EventAdditionalData)
    public additionalData : T = <any>{};
    
    
    public constructor (data? : Partial<Event<T>>, entityManager? : ORM.EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

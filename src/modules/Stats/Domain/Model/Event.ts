import { ColumnType } from '#/App/Domain/DbConfig';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ExtORM from '#/BackendCore/ORM/Ext';
import { Account } from '#/Phala/Domain/Model';
import { StakePool } from '#/Stats/Domain/Model/StakePool';
import { EventRepository } from '#/Stats/Domain/Repository/EventRepository';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


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

class EventAdditionalData
{
    
    @API.Trans.Expose()
    public commission : number;
    
    @API.Trans.Expose()
    public delta : number;
    
}


@ORM.Entity({
    tableName: 'stats_event',
    customRepository: () => EventRepository
})
@API.Resource('Stats/Event')
export class Event<T extends AbstractEventData>
    extends AbstractModel<Event<T>>
{
    
    [ORM.EntityRepositoryType]? : EventRepository<T>;
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    @ORM.Property({ index: true })
    @API.Property()
    @API.Groups([
        'Stats/Event'
    ])
    public blockNumber : number;
    
    @ORM.Property()
    @API.Property()
    @API.Groups([
        'Stats/Event'
    ])
    public blockDate : Date;
    
    
    @ORM.Property({ index: true })
    @ORM.Enum({ items: () => EventType })
    @API.Property()
    @API.Groups([
        'Stats/Event'
    ])
    @API.Filterable()
    public type : EventType = null;
    
    
    @ORM.ManyToOne(() => StakePool, { nullable: true })
    public stakePool : StakePool;
    
    @ORM.ManyToOne(() => Account, { nullable: true })
    public sourceAccount : Account;
    
    @ORM.ManyToOne(() => Account, { nullable: true })
    public targetAccount : Account;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE, nullable: true })
    @API.Property()
    @API.Groups([
        'Stats/Event'
    ])
    public amount : number = 0;
    
    
    @ORM.Property({ type: ORM.JsonType })
    @API.Property(() => EventAdditionalData)
    @API.Groups([
        'Stats/Event'
    ])
    public additionalData : T = <any>{};
    
    
    public constructor (data? : Partial<Event<T>>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

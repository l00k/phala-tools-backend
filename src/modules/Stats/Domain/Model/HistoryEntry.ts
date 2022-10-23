import { ColumnType } from '#/App/Domain/DbConfig';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ExtORM from '#/BackendCore/ORM/Ext';
import { Snapshot } from '#/Stats/Domain/Model/Snapshot';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import { HistoryEntryRepository } from '#/Stats/Domain/Repository/HistoryEntryRepository';
import { API } from '@inti5/api-backend';
import { Type } from '@inti5/graph-typing';
import * as ORM from '@mikro-orm/core';


@ORM.Entity({
    tableName: 'stats_historyentry',
    customRepository: () => HistoryEntryRepository
})
@ORM.Index({
    properties: [
        'stakePoolEntry',
        'snapshot'
    ]
})
@API.Resource('Stats/HistoryEntry')
export class HistoryEntry
    extends AbstractModel<HistoryEntry>
{
    
    [ORM.EntityRepositoryType]? : HistoryEntryRepository;
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    @ORM.ManyToOne(() => StakePoolEntry)
    public stakePoolEntry : StakePoolEntry;
    
    @ORM.ManyToOne(() => Snapshot, { eager: true })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    @Type(() => Snapshot)
    public snapshot : Snapshot;
    
    @ORM.Property()
    @API.Property()
    public finalized : boolean = false;
    
    
    @ORM.Property()
    public intermediateStep : number = 0;
    
    
    @ORM.Property({ ...ColumnType.PERCENT })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public commission : number = 0;
    
    @ORM.Property()
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public workersNum : number = 0;
    
    @ORM.Property()
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public workersActiveNum : number = 0;
    
    @ORM.Property({ ...ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public stakeTotal : number = 0;
    
    @ORM.Property({ ...ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public cap : number = 0;
    
    @ORM.Property({ ...ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public stakeFree : number = 0;
    
    @ORM.Property({ ...ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public stakeReleasing : number = 0;
    
    @ORM.Property({ ...ColumnType.BALANCE, nullable: true })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public stakeRemaining : number = null;
    
    @ORM.Property({ ...ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public withdrawals : number = 0;
    
    
    @ORM.Property({ ...ColumnType.PERCENT })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public currentApr : number = 0;
    
    @ORM.Property({ ...ColumnType.PERCENT, nullable: true })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public avgApr : number = null;
    
    
    public constructor (data? : Partial<HistoryEntry>, entityManager? : ORM.EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

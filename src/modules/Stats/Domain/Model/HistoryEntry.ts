import { ColumnType } from '#/App/Domain/DbConfig';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ExtORM from '#/BackendCore/ORM/Ext';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import { HistoryEntryRepository } from '#/Stats/Domain/Repository/HistoryEntryRepository';
import { API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';


@ORM.Entity({
    tableName: 'stats_historyentry',
    customRepository: () => HistoryEntryRepository
})
@ORM.Index({
    properties: [
        'stakePoolEntry',
        'entryNonce',
        'finalized'
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
    
    @ORM.Property({ index: true })
    @API.Property()
    public entryNonce : number;
    
    @ORM.Property()
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public entryDate : Date;
    
    @ORM.Property()
    public finalized : boolean = false;
    
    @ORM.Property()
    public intermediateStep : number = 0;
    
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.PERCENT })
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
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public stakeTotal : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public cap : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public stakeFree : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public stakeReleasing : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE, nullable: true })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public stakeRemaining : number = null;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public withdrawals : number = 0;
    
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.PERCENT })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public currentApr : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.PERCENT, nullable: true })
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

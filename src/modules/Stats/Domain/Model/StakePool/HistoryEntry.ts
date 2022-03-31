import { ColumnType } from '#/App/Domain/DbConfig';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ExtORM from '#/BackendCore/ORM/Ext';
import { StatsStakePool } from '#/Stats/Domain/Model/StatsStakePool';
import { HistoryEntryRepository } from '#/Stats/Domain/Repository/StakePool/HistoryEntryRepository';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


@ORM.Entity({
    tableName: 'stats_stakepool_historyentry',
    customRepository: () => HistoryEntryRepository
})
@API.Resource('Stats/StakePool/HistoryEntry')
export class HistoryEntry
    extends AbstractModel<HistoryEntry>
{
    
    [ORM.EntityRepositoryType]? : HistoryEntryRepository;
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    @ORM.ManyToOne(() => StatsStakePool, { lazy: true })
    public stakePool : StatsStakePool;
    
    @ORM.Property({ index: true })
    @API.Property()
    public entryNonce : number;
    
    @ORM.Property()
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public entryDate : Date;
    
    
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
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public stakeRemaining : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public withdrawals : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.ENC_BIG_DECIMAL })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public vTotal : number = 0;
    
    @ORM.Property({ unsigned: true })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public pTotal : number = 0;
    
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public rewardsTotal : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public currentRewardsDaily : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.PERCENT })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public currentApr : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.BALANCE })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public avgRewardsDaily : number = 0;
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.PERCENT, nullable: true })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public avgApr : number = null;
    
    
    public constructor (data? : Partial<HistoryEntry>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

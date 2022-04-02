import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as Phala from '#/Phala/Domain/Model';
import { HistoryEntry } from '#/Stats/Domain/Model/HistoryEntry';
import { Issue } from '#/Stats/Domain/Model/Issue';
import { Worker } from '#/Stats/Domain/Model/Worker';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


@ORM.Entity({
    tableName: 'stats_stakepool'
})
@API.Resource('Stats/StakePoolEntry')
export class StakePoolEntry
    extends AbstractModel<StakePoolEntry>
{
    
    public static readonly SPECIAL_NETWORK_AVG_ID = 1;
    public static readonly SPECIAL_TOP_AVG_ID = 2;
    public static readonly SPECIAL_ONCHAIN_ID_OFFSET = 1000000;
    
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    
    @ORM.OneToOne(() => Phala.StakePool, null, { nullable: true, eager: true })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public stakePool : Phala.StakePool;
    
    
    @ORM.Property({ type: 'string', nullable: true })
    @API.Property()
    public special : string;
    
    @ORM.OneToOne(() => HistoryEntry, null, { nullable: true, eager: true })
    @API.Property(() => HistoryEntry)
    @API.Filterable()
    @API.Sortable()
    public lastHistoryEntry : HistoryEntry = null;
    
    @ORM.OneToMany(() => HistoryEntry, entry => entry.stakePool, { lazy: true })
    public historyEntries : ORM.Collection<HistoryEntry>;
    
    @ORM.OneToMany(() => Worker, worker => worker.stakePool, { lazy: true })
    public workers : ORM.Collection<Worker>;
    
    
    @ORM.ManyToMany(() => Issue, null, { lazy: true })
    @API.Property(() => Issue)
    @API.Filterable()
    public issues : ORM.Collection<Issue>;
    
    
    @ORM.Property({ onCreate: () => new Date() })
    public createdAt : Date = new Date();
    
    @ORM.Property({ onUpdate: () => new Date() })
    public updatedAt : Date = new Date();
    
    
    // runtime values
    public snapshotWorkers : Worker[] = [];
    
    
    public constructor (data? : Partial<StakePoolEntry>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        
        this.historyEntries = new ORM.Collection<HistoryEntry>(this, []);
        this.workers = new ORM.Collection<Worker>(this, []);
        this.issues = new ORM.Collection<Issue>(this, []);
        
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

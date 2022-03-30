import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Account } from '#/Stats/Domain/Model/Account';
import { HistoryEntry } from '#/Stats/Domain/Model/StakePool/HistoryEntry';
import { Issue } from '#/Stats/Domain/Model/StakePool/Issue';
import { Worker } from '#/Stats/Domain/Model/Worker';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


@ORM.Entity()
@API.Resource('Stats/StakePool')
export class StakePool
    extends AbstractModel<StakePool>
{
    
    public static readonly SPECIAL_NETWORK_AVG_ID = 1;
    public static readonly SPECIAL_TOP_AVG_ID = 2;
    public static readonly SPECIAL_ONCHAIN_ID_OFFSET = 1000000;
    
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    
    @ORM.Property({ nullable: true })
    @API.Property()
    @API.Groups([
        'Stats/StakePool'
    ])
    public special : string;
    
    @ORM.Property({ nullable: true })
    @API.Property()
    @API.Groups([
        'Stats/StakePool'
    ])
    @API.Filterable()
    @API.Sortable()
    public onChainId : number;
    
    @ORM.ManyToOne(() => Account)
    @API.Property(() => Account)
    @API.Groups([
        'Stats/StakePool'
    ])
    @API.Filterable()
    @API.Sortable()
    public owner : Account;
    
    @ORM.OneToOne(() => HistoryEntry, null, { nullable: true, eager: true })
    @API.Property(() => HistoryEntry)
    @API.Groups([
        'Stats/StakePool'
    ])
    @API.Filterable()
    @API.Sortable()
    public lastHistoryEntry : HistoryEntry = null;
    
    @ORM.OneToMany(() => HistoryEntry, entry => entry.stakePool, { lazy: true })
    public historyEntries : ORM.Collection<HistoryEntry>;
    
    @ORM.OneToMany(() => Worker, worker => worker.stakePool, { lazy: true })
    public workers : ORM.Collection<Worker>;
    
    
    @ORM.ManyToMany(() => Issue, null, { lazy: true })
    @API.Property(() => Issue)
    @API.Groups([
        'Stats/StakePool'
    ])
    @API.Filterable()
    public issues : ORM.Collection<Issue>;
    
    
    // runtime values
    public snapshotWorkers : Worker[] = [];
    
    
    public constructor (data? : Partial<StakePool>, entityManager? : EntityManager)
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

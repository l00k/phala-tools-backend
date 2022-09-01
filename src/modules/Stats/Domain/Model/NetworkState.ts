import { ColumnType } from '#/App/Domain/DbConfig';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { Snapshot } from '#/Stats/Domain/Model/Snapshot';
import { API } from '@inti5/api-backend';
import { Type } from '@inti5/graph-typing';
import * as ORM from '@mikro-orm/core';


@ORM.Entity({
    tableName: 'stats_networkstate',
})
@API.Resource('Stats/NetworkState')
export class NetworkState
    extends AbstractModel<NetworkState>
{
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    @ORM.OneToOne(() => Snapshot, null, { eager: true, orphanRemoval: false })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    @Type(() => Snapshot)
    public snapshot : Snapshot;
    
    
    @ORM.Property({ ...ColumnType.ENC_BIG_DECIMAL })
    @API.Property()
    public totalShares : number = 0;
    
    
    public constructor (data? : Partial<NetworkState>, entityManager? : ORM.EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

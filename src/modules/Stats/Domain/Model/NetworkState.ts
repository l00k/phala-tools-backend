import { ColumnType } from '#/App/Domain/DbConfig';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ExtORM from '#/BackendCore/ORM/Ext';
import { Annotation as API } from '@inti5/api-backend';
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
    
    @ORM.Property({ unique: true })
    @API.Property()
    public entryNonce : number;
    
    @ORM.Property()
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public entryDate : Date;
    
    
    @ORM.Property({ type: ExtORM.DecimalType, columnType: ColumnType.ENC_BIG_DECIMAL })
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

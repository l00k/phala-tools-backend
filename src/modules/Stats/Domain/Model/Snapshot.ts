import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import { API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';


@ORM.Entity({
    tableName: 'stats_snapshot',
})
@API.Resource('Stats/Snapshot')
export class Snapshot
    extends AbstractModel<Snapshot>
{
    
    @ORM.PrimaryKey()
    @API.Id()
    public id : number;
    
    @ORM.Property({ unsigned: true })
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public blockNumber : number;
    
    @ORM.Property()
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public blockHash : string;
    
    @ORM.Property()
    @API.Property()
    @API.Filterable()
    @API.Sortable()
    public date : Date;
    
    
    public constructor (
        data? : Partial<Snapshot>,
        em? : ORM.EntityManager
    )
    {
        super(data, em);
        if (data) {
            this.assign(data, { em });
        }
    }
    
}

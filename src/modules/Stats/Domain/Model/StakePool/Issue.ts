import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { Annotation as API } from '@inti5/api-backend';


@ORM.Entity({
    tableName: 'stats_stakepool_issue'
})
@API.Resource('Stats/StakePool/Issue')
export class Issue
    extends AbstractModel<Issue>
{
    
    public static readonly BAD_BEHAVIOR_ID = 1;
    public static readonly SLASHED_ID = 2;
    
    
    @ORM.PrimaryKey()
    @API.Id()
    @API.Filterable()
    public id : number;
    
    @ORM.Property()
    @API.Property()
    @API.Groups([
        'Stats/StakePool/Issue',
    ])
    public name : string;
    
    @ORM.Property()
    @API.Property()
    @API.Groups([
        'Stats/StakePool/Issue'
    ])
    public description : string;
    
    @ORM.Property()
    @API.Property()
    @API.Groups([
        'Stats/StakePool/Issue'
    ])
    public color : string;
    
    
    public constructor (data? : Partial<Issue>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

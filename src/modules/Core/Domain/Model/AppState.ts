import * as ORM from '@mikro-orm/core';
import { AbstractModel } from '@inti5/app-backend/Module/AbstractModel';


@ORM.Entity()
export class AppState<T>
    extends AbstractModel<AppState<T>>
{
    
    @ORM.PrimaryKey()
    public id : string;
    
    @ORM.Property({ type: ORM.JsonType })
    public value : T;
    
}

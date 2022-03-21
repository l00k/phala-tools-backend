import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AbstractModel } from '@inti5/app-backend/Module/AbstractModel';



@ORM.Entity({
    tableName: 'core_tasker_task'
})
export class Task
    extends AbstractModel<Task>
{
    
    
    @ORM.PrimaryKey()
    public id : number;
    
    @ORM.Property({ unique: true })
    public taskKey : string;
    
    @ORM.Property({ nullable: true })
    public lastExecution : Date;
    
    
    public constructor (data? : Partial<Task>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

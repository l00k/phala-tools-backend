import * as ORM from '@mikro-orm/core';
import { AbstractModel } from '#/BackendCore/Domain/Model/AbstractModel';



export abstract class AbstractIssue<T>
    extends AbstractModel<AbstractIssue<T>>
{
    
    public static readonly REMINDER_DELAY : number = 24 * 60;
    
    
    @ORM.PrimaryKey()
    public id : number;
    
    @ORM.Property()
    public occurrenceDate : Date;
    
    
    public constructor (data? : Partial<AbstractIssue<T>>, entityManager? : ORM.EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

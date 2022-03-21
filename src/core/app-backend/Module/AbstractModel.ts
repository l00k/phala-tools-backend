import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/core';
import { Exception } from '../Exception';


export class AbstractModel<T extends { id : any }>
    extends ORM.BaseEntity<T, 'id'>
{

    public constructor(data? : Partial<T>, entityManager? : EntityManager)
    {
        super();
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}

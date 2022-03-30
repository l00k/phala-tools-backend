import { Event, EventType } from '#/Stats/Domain/Model/Event';
import { QueryOrder } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/mysql';


export class EventRepository<T>
    extends EntityRepository<Event<T>>
{
    
    public async findDistinctContributions ()
    {
        const events = await this.createQueryBuilder()
            .select([ 'id', 'sourceAccount', 'stakePool' ])
            .where({
                type: EventType.Contribution
            })
            .groupBy([ 'sourceAccount', 'stakePool' ])
            .getResult();
        
        await this.em.populate(events, [ 'sourceAccount', 'stakePool' ]);
        
        return events;
    }
    
}

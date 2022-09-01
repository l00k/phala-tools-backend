import { HistoryEntry } from '#/Stats/Domain/Model/HistoryEntry';
import { EntityRepository } from '@mikro-orm/mysql';


export class HistoryEntryRepository
    extends EntityRepository<HistoryEntry>
{
    
    public async getAvgApr (
        stakePoolEntryId : number,
        snapshotThreshold : number
    ) : Promise<number>
    {
        const qb = this.createQueryBuilder();
        
        const { result } = await qb
            .select('AVG(current_apr) as result')
            .where({
                stakePoolEntry: stakePoolEntryId,
                snapshot: { $gte: snapshotThreshold }
            })
            .limit(1)
            .execute<{ result : number }>('get');
        
        return result;
    }
    
}

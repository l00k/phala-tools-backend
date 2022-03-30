import { EntityRepository } from '@mikro-orm/mysql';
import { HistoryEntry } from '#/Stats/Domain/Model/StakePool/HistoryEntry';


export class HistoryEntryRepository
    extends EntityRepository<HistoryEntry>
{


}

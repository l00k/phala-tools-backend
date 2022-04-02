import { EntityRepository } from '@mikro-orm/mysql';
import { HistoryEntry } from '#/Stats/Domain/Model/HistoryEntry';


export class HistoryEntryRepository
    extends EntityRepository<HistoryEntry>
{


}

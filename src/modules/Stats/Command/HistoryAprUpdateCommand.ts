import { HistoryAprUpdater } from '#/Stats/Service/HistoryAprUpdater';
import { DependencyInjection, ObjectManager } from '@inti5/object-manager';
import * as CLI from 'classy-commander';


@CLI.command(
    'stats-history-apr-update',
    Object,
    'Stats / History APR update'
)
@DependencyInjection()
export class CrawlerCommand
    implements CLI.Command<Object>
{
    
    public async execute () : Promise<void>
    {
        const updater = ObjectManager.getSingleton()
            .getInstance(HistoryAprUpdater);
        await updater.run();
    }
    
}

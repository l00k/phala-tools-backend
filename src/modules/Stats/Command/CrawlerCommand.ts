import { OnChainEventsCrawler } from '#/Stats/Tasker/OnChainEventsCrawler';
import { StakePoolHistoryCrawler } from '#/Stats/Tasker/StakePoolHistoryCrawler';
import { StakePoolIssuesCrawler } from '#/Stats/Tasker/StakePoolIssuesCrawler';
import { DependencyInjection, ObjectManager } from '@inti5/object-manager';
import * as CLI from 'classy-commander';


@CLI.command('stats-crawler', Object, 'Stats / Crawler')
@DependencyInjection()
export class CrawlerCommand
    implements CLI.Command<Object>
{
    
    public async execute () : Promise<void>
    {
        // history entries
        {
            const crawler = ObjectManager.getSingleton()
                .getInstance(StakePoolHistoryCrawler);
            await crawler.run();
        }
        
        // events
        {
            const crawler = ObjectManager.getSingleton()
                .getInstance(OnChainEventsCrawler);
            await crawler.run();
        }
        
        // issues
        {
            const crawler = ObjectManager.getSingleton()
                .getInstance(StakePoolIssuesCrawler);
            await crawler.run();
        }
    }
    
}

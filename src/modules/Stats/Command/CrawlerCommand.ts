import { EventsCrawler } from '#/Stats/Crawler/EventsCrawler';
import { HistoryCrawler } from '#/Stats/Crawler/HistoryCrawler';
import { IssuesCrawler } from '#/Stats/Crawler/IssuesCrawler';
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
                .getInstance(HistoryCrawler);
            await crawler.run();
        }
        
        // events
        {
            const crawler = ObjectManager.getSingleton()
                .getInstance(EventsCrawler);
            await crawler.run();
        }

        // issues
        {
            const crawler = ObjectManager.getSingleton()
                .getInstance(IssuesCrawler);
            await crawler.run();
        }
    }
    
}

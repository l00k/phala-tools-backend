import { IssueController } from '#/Stats/Controller/IssueController';
import { StakePoolHistoryCrawler } from '#/Stats/Tasker/StakePoolHistoryCrawler';
import { DependencyInjection, ObjectManager } from '@inti5/object-manager';
import * as CLI from 'classy-commander';


@CLI.command('stats-crawler', Object, 'Stats / Crawler')
@DependencyInjection()
export class CrawlerCommand
    implements CLI.Command<Object>
{
    
    public async execute () : Promise<void>
    {
        const crawler = ObjectManager.getSingleton()
            .getInstance(StakePoolHistoryCrawler);
        
        await crawler.run();
    }
    
}

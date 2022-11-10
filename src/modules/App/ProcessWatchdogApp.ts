import { BaseApp } from '#/BackendCore/Module/BaseApp';
import { CrawlerService } from '#/Watchdog/Service/EventCrawler/CrawlerService';
import { ObjectManager } from '@inti5/object-manager';


export class ProcessWatchdogApp
    extends BaseApp
{
    
    public async run () : Promise<void>
    {
        const objectManager = ObjectManager.getSingleton();
        
        this.loadModules([
            'Crawler',
            'Tasker'
        ]);
        
        // watchdog crawler
        const crawler = objectManager.getInstance(CrawlerService);
        await crawler.run();
    }
    
}

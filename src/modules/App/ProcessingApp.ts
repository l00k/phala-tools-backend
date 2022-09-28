import { BaseApp } from '#/BackendCore/Module/BaseApp';
import { TaskerService } from '#/BackendCore/Service/Tasker/TaskerService';
import { CrawlerService } from '#/Watchdog/Service/EventCrawler/CrawlerService';
import { ObjectManager } from '@inti5/object-manager';


export class ProcessingApp
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
        // const crawler = objectManager.getInstance(CrawlerService);
        // await crawler.run();
        
        // global taskers
        const tasker = objectManager.getInstance(TaskerService);
        await tasker.run();
    }
    
}

import { AbstractApp } from '#/BackendCore/Module/AbstractApp';
import { TaskerService } from '#/BackendCore/Service/Tasker/TaskerService';
import { CrawlerService } from '#/Watchdog/Service/EventCrawler/CrawlerService';
import { ObjectManager } from '@inti5/object-manager';


export class ProcessingApp
    extends AbstractApp
{
    
    protected async _main ()
    {
        const objectManager = ObjectManager.getSingleton();
        
        this._loadModules([
            'Crawler',
            'Tasker'
        ]);
        
        // watchdog crawler
        const crawler = objectManager.getInstance(CrawlerService);
        await crawler.run();
        
        // global taskers
        const tasker = objectManager.getInstance(TaskerService);
        await tasker.run();
    }
    
}

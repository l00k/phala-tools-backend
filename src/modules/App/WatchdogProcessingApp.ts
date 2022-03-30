import { AbstractApp } from '#/BackendCore/Module/AbstractApp';
import { TaskerService } from '#/BackendCore/Service/Tasker/TaskerService';
import { CrawlerService } from '#/Watchdog/Service/Crawler/CrawlerService';
import { ObjectManager } from '@inti5/object-manager';


export class WatchdogProcessingApp
    extends AbstractApp
{
    
    protected async _main ()
    {
        const objectManager = ObjectManager.getSingleton();
        
        const crawler = objectManager.getInstance(CrawlerService);
        await crawler.run();
        
        const tasker = objectManager.getInstance(TaskerService);
        await tasker.run();
    }
    
}

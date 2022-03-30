import { AbstractApp } from '#/BackendCore/Module/AbstractApp';
import { TaskerService } from '#/BackendCore/Service/Tasker/TaskerService';
import { ObjectManager } from '@inti5/object-manager';


export class StatsProcessingApp
    extends AbstractApp
{
    
    protected async _main ()
    {
        const objectManager = ObjectManager.getSingleton();
        
        const tasker = objectManager.getInstance(TaskerService);
        await tasker.run();
    }
    
}

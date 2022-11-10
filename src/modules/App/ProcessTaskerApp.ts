import { BaseApp } from '#/BackendCore/Module/BaseApp';
import { TaskerService } from '#/BackendCore/Service/Tasker/TaskerService';
import { ObjectManager } from '@inti5/object-manager';


export class ProcessTaskerApp
    extends BaseApp
{
    
    public async run () : Promise<void>
    {
        const objectManager = ObjectManager.getSingleton();
        
        this.loadModules([
            'Crawler',
            'Tasker'
        ]);
        
        // global taskers
        const tasker = objectManager.getInstance(TaskerService);
        await tasker.run();
    }
    
}

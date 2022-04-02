import { IssueController } from '#/Stats/Controller/IssueController';
import { UserController } from '#/Watchdog/Controller/UserController';
import { DependencyInjection, ObjectManager } from '@inti5/object-manager';
import * as CLI from 'classy-commander';
import * as Api from '@inti5/api-backend';


@CLI.command('test', Object, 'Test')
@DependencyInjection()
export class TestCommand
    implements CLI.Command<Object>
{
    
    public async execute () : Promise<void>
    {
        const apiService = ObjectManager.getSingleton()
            .getInstance(Api.Service);
        apiService.bootstrap();
    
        const controller = ObjectManager.getSingleton()
            .getInstance(IssueController);
        
        const result = await (<any>controller.getCollection)({
            authData: {
                userId: 1,
            }
        });
        
        console.dir(result);
    }
    
}

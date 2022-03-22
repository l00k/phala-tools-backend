import { IdentityProvider } from '#/Messaging/Service/Discord/IdentityProvider';
import { CrawlerService } from '#/Watchdog/Service/Crawler/CrawlerService';
import { DependencyInjection, ObjectManager } from '@inti5/object-manager';
import * as CLI from 'classy-commander';


@CLI.command('test', Object, 'Test')
@DependencyInjection()
export class DumpCommand
    implements CLI.Command<Object>
{
    
    public async execute () : Promise<void>
    {
        const service = ObjectManager.getSingleton()
            .getInstance(IdentityProvider);
        
    }
    
    public async loginDiscord () : Promise<void>
    {
        const service = ObjectManager.getSingleton()
            .getInstance(IdentityProvider);
        
        const result = await service.getIdentity('JkHrgrWGbum4unL4BEUv6D3clwuJns');
        console.dir(result);
    }
    
}

import { MessagingChannel, MessagingProvider } from '#/Messaging/Service/MessagingProvider';
import { DependencyInjection, ObjectManager } from '@inti5/object-manager';
import * as CLI from 'classy-commander';


@CLI.command('test', Object, 'Test')
@DependencyInjection()
export class DumpCommand
    implements CLI.Command<Object>
{
    
    public async execute () : Promise<void>
    {
        const discord = ObjectManager.getSingleton()
            .getInstance(MessagingProvider);
        
        await discord.sendMessage(
            MessagingChannel.Discord,
            'l00k#1990',
            'Test'
        );
    }
    
}

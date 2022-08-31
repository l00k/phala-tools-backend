import { BaseCliApp } from '#/BackendCore/Module/BaseCliApp';
import * as CLI from 'classy-commander';


export class CliApp
    extends BaseCliApp
{
    
    public async run () : Promise<void>
    {
        this.loadModules([
            'Command'
        ]);
        
        const argv = process.argv.splice(1);
        await CLI.execute(argv);
    }
    
}

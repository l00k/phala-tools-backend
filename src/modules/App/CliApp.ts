import { BaseCliApp } from '#/BackendCore/Module/BaseCliApp';
import * as CLI from 'classy-commander';


export class CliApp
    extends BaseCliApp
{
    
    protected async _main ()
    {
        this.loadModules([
            'Command'
        ]);
        
        const argv = process.argv.splice(1);
        await CLI.execute(argv);
    }
    
}

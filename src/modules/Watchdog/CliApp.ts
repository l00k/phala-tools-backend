import { AbstractCliApp } from '#/AppBackend/Module/AbstractCliApp';
import * as CLI from 'classy-commander';


export class CliApp
    extends AbstractCliApp
{
    
    protected async main ()
    {
        this.moduleLoader.load(['Command']);
        
        const argv = process.argv.splice(1);
        await CLI.execute(argv);
    }
    
}

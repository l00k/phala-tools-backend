import { AbstractCliApp } from '#/BackendCore/Module/AbstractCliApp';
import * as CLI from 'classy-commander';


export class CliApp
    extends AbstractCliApp
{
    
    protected async _main ()
    {
        this._moduleLoader.load(['Command']);
        
        const argv = process.argv.splice(1);
        await CLI.execute(argv);
    }
    
}

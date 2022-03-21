import { AbstractApp } from '@inti5/app-backend/Module/AbstractApp';
import * as CLI from 'classy-commander';


export abstract class AbstractCliApp
    extends AbstractApp
{
    
    protected async main ()
    {
        this.moduleLoader.load(['Command']);
        await CLI.execute();
    }
    
}

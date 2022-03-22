import { AbstractApp } from '@inti5/app-backend/Module/AbstractApp';
import { Configuration } from '@inti5/configuration';
import { ExpressConfig, ExpressFactory } from '@inti5/express-ext';
import { ObjectManager } from '@inti5/object-manager';


export class ApiApp
    extends AbstractApp
{
    
    protected async main ()
    {
        const configuration = Configuration.getSingleton();
        const expressFactory = ObjectManager.getSingleton().getInstance(ExpressFactory);
        
        const config : ExpressConfig = {
            listenOnPort: Number(process.env.API_PORT),
            https: false,
            jwtSecret: configuration.get('core.jwtSecret'),
        };
        
        await expressFactory.create(config);
        
        return new Promise(solve => {
            process.once('SIGINT', () => solve(true));
        });
    }
    
}

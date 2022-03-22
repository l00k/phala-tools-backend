import { AbstractApp } from '@inti5/app-backend/Module/AbstractApp';
import { ExpressConfig, ExpressFactory } from '@inti5/express-ext/Factory';
import { ObjectManager } from '@inti5/object-manager';


export class ApiApp
    extends AbstractApp
{
    
    protected async main ()
    {
        const expressFactory = ObjectManager.getSingleton()
            .getInstance(ExpressFactory);
        
        const config : ExpressConfig = {
            listenOnPort: Number(process.env.API_PORT),
            https: false,
            jwtSecret: process.env.JWT_SECRET,
        };
        
        await expressFactory.create(config);
        
        return new Promise(solve => {
            process.once('SIGINT', () => solve(true));
        });
    }
    
}

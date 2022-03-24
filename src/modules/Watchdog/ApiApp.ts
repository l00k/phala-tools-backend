import { AbstractApp } from '#/BackendCore/Module/AbstractApp';
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
            jwtAccessTokenPrivateKey: configuration.get('core.jwt.accessToken.privateKey'),
        };
        
        await expressFactory.create(config);
        
        return new Promise(solve => {
            process.once('SIGINT', () => solve(true));
        });
    }
    
}

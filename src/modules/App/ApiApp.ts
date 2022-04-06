import { AbstractApp } from '#/BackendCore/Module/AbstractApp';
import * as Api from '@inti5/api-backend';
import { Configuration } from '@inti5/configuration';
import { ExpressConfig, ExpressFactory } from '@inti5/express-ext';
import { ObjectManager } from '@inti5/object-manager';
import { MikroORM } from '@mikro-orm/core';


export class ApiApp
    extends AbstractApp
{
    
    protected async _main ()
    {
        const objectManager = ObjectManager.getSingleton();
    
        // load additional modules
        this._loadModules([
            'Controller'
        ]);
    
        // setup express server
        const configuration = Configuration.getSingleton();
        const expressFactory = objectManager.getInstance(ExpressFactory);
        
        const config : ExpressConfig = {
            listenOnPort: Number(process.env.API_PORT),
            https: false,
            jwtAccessTokenPrivateKey: configuration.get('core.jwt.accessToken.privateKey'),
        };
        
        await expressFactory.create(config);
        
        // bootstrap api
        const apiService = objectManager.getInstance(Api.Service);
        apiService.bootstrap();
        
        // get entity manager and bind to api
        const orm = objectManager.getService<MikroORM>('orm');
        const entityManager = orm.em.fork(true);
        
        apiService.bindEntityManager(entityManager);
        
        
        return new Promise(solve => {
            process.once('SIGINT', () => solve(true));
        });
    }
    
}

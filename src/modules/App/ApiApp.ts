import { BaseApp } from '#/BackendCore/Module/BaseApp';
import * as Api from '@inti5/api-backend';
import { Configuration } from '@inti5/configuration';
import { ExpressConfig, ExpressFactory } from '@inti5/express-router';
import { ObjectManager } from '@inti5/object-manager';
import { MikroORM } from '@mikro-orm/core';


export class ApiApp
    extends BaseApp
{
    
    protected async _main ()
    {
        const objectManager = ObjectManager.getSingleton();
    
        // load additional modules
        this.loadModules([
            'Controller'
        ]);
        
        // bootstrap api
        const apiService = objectManager.getInstance(Api.Service);
        apiService.bootstrap();
        
        // get entity manager and bind to api
        const orm = objectManager.getService<MikroORM>('orm');
        const entityManager = orm.em.fork(true);
        
        apiService.bindEntityManager(entityManager);
    
        // setup express server
        const configuration = Configuration.getSingleton();
        const expressFactory = objectManager.getInstance(ExpressFactory);
        
        const expressApp = expressFactory.create({
            useLogger: true,
            useJwtTokens: true,
            jwtAccessTokenPrivateKey: configuration.get('core.jwt.accessToken.privateKey'),
        });
        
        // bind OpenAPI
        if (process.env.APP_ENV !== 'production') {
            const openApiExt = objectManager.getInstance(Api.OpenAPI.ExpressExt);
            openApiExt.bindToExpress(
                expressApp,
                {
                    definition: {
                        openapi: '3.0.0',
                        info: {
                            title: 'ForeProtocol API documentation',
                            version: '1.0.0',
                        },
                    }
                }
            );
        }
        
        // start server
        expressFactory.startHttpServer(
            expressApp,
            Number(process.env.API_PORT),
        );
        
        return new Promise(solve => {
            process.once('SIGINT', () => solve(true));
        });
    }
    
}

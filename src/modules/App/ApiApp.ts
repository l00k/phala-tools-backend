import { BaseApp } from '#/BackendCore/Module/BaseApp';
import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import * as Api from '@inti5/api-backend';
import { Configuration } from '@inti5/configuration';
import { ExpressFactory } from '@inti5/express-router';
import { ObjectManager } from '@inti5/object-manager';


export class ApiApp
    extends BaseApp
{
    
    public async run () : Promise<void>
    {
        const objectManager = ObjectManager.getSingleton();
        
        // load additional modules
        this.loadModules([
            'Controller'
        ]);
        
        // bootstrap api
        const api = objectManager.getInstance(Api.Service);
        api.bootstrap();
        
        const entityManagerWrapper = objectManager.getInstance(EntityManagerWrapper);
        const entityManager = entityManagerWrapper.getCleanEntityManager();
        api.bindEntityManager(entityManager);
        
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
        
        // infinite promise until kill signal
        return new Promise(solve => {
            process.once('SIGINT', () => solve());
        });
    }
    
}

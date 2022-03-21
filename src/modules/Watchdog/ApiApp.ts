import AbstractApp from '@inti5/app-backend/Module/AbstractApp';
import { ObjectManager } from '@inti5/object-manager';
import ExpressFactory, { ExpressConfig } from '@inti5/app-backend/Express/Factory';
import fs from 'fs';
import https from 'https';
import Router from '@inti5/app-backend/Router';


const env = process.env.NODE_ENV || 'production';
const isDev = env !== 'production';


export class ApiApp
    extends AbstractApp
{
    
    protected async main ()
    {
        const expressFactory = ObjectManager.getSingleton()
            .getInstance(ExpressFactory);
            
        const config : ExpressConfig = {
            listenOnPort: Number(process.env.API_PORT),
            useGraphQL: false,
            httpServerOptions: {},
        };
        
        // if (isDev) {
        //     config.startGraphQLPlaygroundMiddleware = true;
        // }
        // else {
        //     // setup certs
        //     const rootPath = process.cwd();
        //     config.httpServerOptions = {
        //         key: fs.readFileSync(`${ rootPath }/.cert/privkey.pem`, 'utf8'),
        //         cert: fs.readFileSync(`${ rootPath }/.cert/cert.pem`, 'utf8'),
        //         ca: fs.readFileSync(`${ rootPath }/.cert/chain.pem`, 'utf8'),
        //     };
        // }
        
        await expressFactory.create(config);
        
        return new Promise(solve => {
            process.once('SIGINT', () => solve(true));
        });
    }
    
}

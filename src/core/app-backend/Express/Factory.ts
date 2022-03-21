import { Configuration } from '@inti5/configuration';
import { Router } from '@inti5/express-router';
import { ModuleLoader } from '@inti5/node-loader/ModuleLoader';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { MikroORM } from '@mikro-orm/core';
import bodyParser from 'body-parser';
import colors from 'colors';
import cors from 'cors';
import express, { Request } from 'express';
import http from 'http';
import https, { ServerOptions } from 'https';


export type ExpressConfig = {
    listenOnPort : number,
    https? : boolean,
    serverOptions? : ServerOptions,
}


export class ExpressFactory
{
    
    @Inject({ ctorArgs: [ 'Express' ] })
    protected logger : Logger;
    
    @Inject()
    protected configuration : Configuration;
    
    @Inject()
    protected moduleLoader : ModuleLoader;
    
    @Inject()
    protected router : Router;
    
    @Inject({ name: 'orm' })
    protected orm : MikroORM;
    
    
    public async create (config : ExpressConfig) : Promise<express.Application>
    {
        const expressServer = express();
        
        expressServer.disable('x-powered-by');
        expressServer.set('trust proxy', 1);
        
        expressServer.use(cors({ origin: true }));
        expressServer.use(bodyParser.urlencoded({ extended: false }));
        expressServer.use(bodyParser.json());
        
        expressServer.use((request : Request, resp, next) => {
            this.logger.log('Incoming request', colors.green(request.method), colors.cyan(request.path));
            next();
        });
        
        const serverOptions = {
            https: false,
            ...(config.serverOptions || {})
        };
        const server = config.https
            ? https.createServer(serverOptions, expressServer)
            : http.createServer(serverOptions, expressServer);
            
        this.router.bindExpress(expressServer);
        
        server.listen(config.listenOnPort, () => {
            this.logger.log(`Http server ready on port ${config.listenOnPort}...`);
        });
        
        return expressServer;
    }
    
}

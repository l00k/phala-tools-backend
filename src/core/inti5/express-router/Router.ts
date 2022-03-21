import { Inject, ObjectManager, Singleton } from '@inti5/object-manager';
import { ClassConstructor } from '@inti5/object-manager/def';
import { Exception } from '@inti5/utils/Exception';
import { Logger } from '@inti5/utils/Logger';
import { mergeRecursive } from '@inti5/utils/mergeRecursive';
import { ValidationException } from '@inti5/validator';
import express from 'express';
import isEmpty from 'lodash/isEmpty';
import trim from 'lodash/trim';
import { ActionResult } from './ActionResult';
import { Controller } from './Controller';
import { ControllerDescription, RouteDescription } from './def';
import colors from 'colors';



@Singleton()
export class Router
{
    
    @Inject({ ctorArgs: [ Router.name ] })
    protected logger : Logger;
    
    protected routes : Map<ClassConstructor<Controller>, ControllerDescription> = new Map();
    
    protected controllers : Map<ClassConstructor<Controller>, Controller> = new Map();
    
    
    
    public registerBaseRoute (
        ControllerConstructor : ClassConstructor<Controller>,
        baseRoute : Partial<RouteDescription>
    )
    {
        let controllerRoutes = this.routes.get(ControllerConstructor);
        if (!controllerRoutes) {
            controllerRoutes = {
                baseRoute,
                actions: {},
            };
            this.routes.set(ControllerConstructor, controllerRoutes);
        }
        
        mergeRecursive(controllerRoutes.baseRoute, baseRoute);
    }
    
    public registerRoute (
        ControllerConstructor : ClassConstructor<Controller>,
        method : string,
        route : Partial<RouteDescription>
    )
    {
        let controllerRoutes = this.routes.get(ControllerConstructor);
        if (!controllerRoutes) {
            controllerRoutes = {
                baseRoute: {},
                actions: {},
            };
            this.routes.set(ControllerConstructor, controllerRoutes);
        }
        
        if (!controllerRoutes.actions[method]) {
            controllerRoutes.actions[method] = <any>{};
        }
        
        mergeRecursive(controllerRoutes.actions[method], route);
    }
    
    public bindExpress (express : express.Application)
    {
        const objectManager = ObjectManager.getSingleton();
        
        for (const [ ControllerConstructor, controller ] of this.routes.entries()) {
            const instance : Controller = objectManager.getInstance(<any> ControllerConstructor);
            
            for (const [ actionMethod, methodRoute ] of Object.entries(controller.actions)) {
                const route = {
                    requestMethod: 'GET',
                    contentType: 'text/plain',
                    ...controller.baseRoute,
                    ...methodRoute,
                };
                
                route.path = '/' + [ controller.baseRoute.path, methodRoute.path ]
                    .map(p => trim(p, '/'))
                    .filter(p => !!p)
                    .join('/');
                
                const requestMethod = route.requestMethod.toLowerCase();
                const middlewares = route.middlewares ?? [];
                
                express[requestMethod](
                    route.path,
                    ...middlewares,
                    this.handleRequest.bind(this, instance, route)
                );
            
                this.logger.log(
                    'Route',
                    colors.green(route.requestMethod),
                    colors.cyan(route.path)
                );
            }
        }
    }
    
    protected async handleRequest (
        controller : Controller,
        route : RouteDescription,
        request : express.Request,
        response : express.Response
    )
    {
        // setup headers
        response.contentType(route.contentType);
        
        try {
            // before handle
            const bhResult : any = await controller.beforeHandle(request, response);
            
            // handle route
            const result : any = await controller[route.actionMethod](request, response);
            
            if (result instanceof ActionResult) {
                response.status(result.code);
                response.json(result.payload);
            }
            else if (result !== undefined) {
                response.status(200);
                response.json(result);
            }
        }
        catch (exception) {
            // prepared result
            if (exception instanceof ActionResult) {
                response.status(exception.code);
                response.json(exception.payload);
            }
            // validation exception
            else if (exception instanceof ValidationException) {
                response.status(exception.metadata.responseCode);
                response.json({
                    exception: exception.name,
                    code: exception.code,
                    details: exception.details,
                });
            }
            // generic exception
            else if (exception instanceof Exception) {
                response.status(exception.metadata.responseCode);
                response.json({
                    exception: exception.name,
                    message: exception.message,
                    code: exception.code,
                });
            }
            // default error handling
            else {
                response.status(500);
                
                const msg = 'Internal error!\nCode: ' + (<any>exception).code;
                response.send(msg);
                
                this.logger.error(`### Error 500\n`, exception);
            }
        }
        
        response.end();
    }
    
}

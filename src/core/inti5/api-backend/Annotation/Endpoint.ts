import { SerializationContext } from '@inti5/api';
import { RequestMethod, Route, RouteDescription } from '@inti5/express-router';
import { ApplyGetter, ApplyMapping } from '@inti5/mapper';
import { ObjectManager } from '@inti5/object-manager';
import { Validate } from '@inti5/validator/Method';
import express from 'express';
import { Service } from '../Service';


export type EndpointOptions = {
    requestMethod : RequestMethod
}

function Endpoint (path : string, options : Partial<EndpointOptions> = {}) : MethodDecorator
{
    options = {
        requestMethod: 'GET',
        ...options
    };
    
    return (ClassPrototype : any, propertyKey : string | symbol, descriptor : PropertyDescriptor) => {
        const api = ObjectManager.getSingleton().getInstance(Service);
        
        // annotations
        const routeOptions : Partial<RouteDescription> = {
            requestMethod: options.requestMethod,
            contentType: 'application/json',
            middlewares: [
                express.json()
            ]
        };
        Route(path, routeOptions)(ClassPrototype, propertyKey);
        
        Validate()(ClassPrototype, propertyKey, descriptor);
        
        ApplyMapping()(ClassPrototype, propertyKey, descriptor);
        ApplyGetter()(ClassPrototype, propertyKey, descriptor);
    };
}

export { Endpoint };

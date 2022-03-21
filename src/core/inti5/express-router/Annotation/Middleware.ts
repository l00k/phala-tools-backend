import { ObjectManager } from '@inti5/object-manager';
import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import express from 'express';
import { Router } from '../Router';


function Middleware (middleware : express.RequestHandler);
function Middleware (middlewares : express.RequestHandler[]);

function Middleware ()
{
    const middlewares = arguments[0] instanceof Array
        ? arguments[0]
        : [ arguments[0] ];

    return (Target : any, method : string) => {
        const [ TargetConstructor, TargetPrototype ] = getDecoratorTarget(Target);
        const router = ObjectManager.getSingleton()
            .getInstance(Router);
        
        router.registerRoute(<any> TargetConstructor, method, { middlewares });
    };
}

export { Middleware };

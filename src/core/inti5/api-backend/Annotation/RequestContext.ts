import { Map } from '@inti5/mapper';
import express from 'express';
import { RequestParameters } from '../def';



function getterFn (
    request : express.Request,
    response : express.Response
)
{
    return {
        request,
        response,
    };
}

export function RequestContext () : ParameterDecorator
{
    return (ClassPrototype : any, propertyKey : string | symbol, parameterIndex : number) => {
        Map({
            getterFn,
        })(ClassPrototype, propertyKey, parameterIndex);
    };
}


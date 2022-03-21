import { Map } from '@inti5/mapper';
import { Assert } from '@inti5/validator/Method';
import express from 'express';
import { ClassConstructor } from '../def';


function getterFn (
    request : express.Request,
    response : express.Response
)
{
    return request.body?.modifiers ?? {};
}

function Modifiers (
    ModifiersImpl : ClassConstructor
) : ParameterDecorator
{
    return (ClassPrototype : any, propertyKey : string | symbol, parameterIndex : number) => {
        Assert({}, () => ModifiersImpl, { validateType: false })(ClassPrototype, propertyKey, parameterIndex);
        
        Map({
            getterFn,
            typeFn: () => ModifiersImpl,
        })(ClassPrototype, propertyKey, parameterIndex);
    };
}

export { Modifiers };

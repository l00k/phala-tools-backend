import { Map } from '@inti5/mapper';
import { ObjectManager } from '@inti5/object-manager';
import { Assert } from '@inti5/validator/Method';
import express from 'express';
import { ClassConstructor, TypeFn } from '../def';
import { Service } from '../Service';



function getterFn (
    request : express.Request,
    response : express.Response
)
{
    return request.body?.sorting ?? {};
}

export function Sorting<T> (
    typeFn : TypeFn<T>,
    SortingBaseImpl? : ClassConstructor
) : ParameterDecorator
{
    return (ClassPrototype : any, propertyKey : string | symbol, parameterIndex : number) => {
        const api = ObjectManager.getSingleton().getInstance(Service);
        const SortingImpl = api.getSortingClass(typeFn, SortingBaseImpl);
        
        Assert({}, () => SortingImpl, { validateType: false })(ClassPrototype, propertyKey, parameterIndex);
        
        Map({
            getterFn,
            typeFn: () => SortingImpl,
        })(ClassPrototype, propertyKey, parameterIndex);
    };
}

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
    return request.body?.filters ?? {};
}

export function Filters<T> (
    typeFn : TypeFn<T>,
    FiltersBaseImpl? : ClassConstructor
) : ParameterDecorator
{
    return (ClassPrototype : any, propertyKey : string | symbol, parameterIndex : number) => {
        const api = ObjectManager.getSingleton().getInstance(Service);
        const FiltersImpl = api.getFiltersClass(typeFn, FiltersBaseImpl);
        
        Assert({}, () => FiltersImpl, { validateType: false })(ClassPrototype, propertyKey, parameterIndex);
        
        Map({
            getterFn,
            typeFn: () => FiltersImpl,
        })(ClassPrototype, propertyKey, parameterIndex);
    };
}

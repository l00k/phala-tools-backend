import { Map } from '@inti5/mapper';
import { ObjectManager } from '@inti5/object-manager';
import { Assert } from '@inti5/validator/Method';
import express from 'express';
import { Service } from '../Service';



function getterFn (
    request : express.Request,
    response : express.Response
)
{
    return request.body?.pagination ?? {};
}

function Pagination (
    itemsPerPageOptions : number[] = [ 25, 50, 100 ],
    defaultItemsPerPage? : number
) : ParameterDecorator
{
    if (!defaultItemsPerPage) {
        defaultItemsPerPage = itemsPerPageOptions[0];
    }

    return (ClassPrototype : any, propertyKey : string | symbol, parameterIndex : number) => {
        const api = ObjectManager.getSingleton().getInstance(Service);
        const PaginationImpl = api.getPaginationClass(itemsPerPageOptions, defaultItemsPerPage);
        
        Assert({}, () => PaginationImpl, { validateType: false })(ClassPrototype, propertyKey, parameterIndex);
        
        Map({
            getterFn,
            typeFn: () => PaginationImpl,
        })(ClassPrototype, propertyKey, parameterIndex);
    };
}

export { Pagination };

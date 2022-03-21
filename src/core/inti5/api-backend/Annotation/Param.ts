import { Map } from '@inti5/mapper';
import { NestedRules } from '@inti5/validator/def';
import { Assert } from '@inti5/validator/Method';


function Param (name : string) : ParameterDecorator
{
    return (ClassPrototype : any, propertyKey : string | symbol, parameterIndex : number) => {
        Map({
            getterFn: (request) => request.params[name]
        })(ClassPrototype, propertyKey, parameterIndex);
    };
}

Param.Id = function(assertRules : NestedRules<any> = { numericality: { onlyInteger: true } }) : ParameterDecorator {
    return (ClassPrototype : any, propertyKey : string | symbol, parameterIndex : number) => {
        Assert(assertRules)(ClassPrototype, propertyKey, parameterIndex);
        
        Map({
            getterFn: (request) => request.params.id,
        })(ClassPrototype, propertyKey, parameterIndex);
    };
};


export { Param };

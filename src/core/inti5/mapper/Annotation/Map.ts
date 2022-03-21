import { ClassConstructor } from 'class-transformer';
import { ParamMapOptions, MapSymbol } from '../def';


export type TypeFn = () => ClassConstructor<any>;

function Map () : ParameterDecorator;
function Map (
    typeFn : TypeFn
) : ParameterDecorator;
function Map (
    options : Partial<ParamMapOptions>
) : ParameterDecorator;
function Map (
    typeFn : TypeFn,
    options : Partial<ParamMapOptions>
) : ParameterDecorator;


function Map<T> () : ParameterDecorator
{
    let typeFn : TypeFn;
    let options : Partial<ParamMapOptions> = {};
    
    if (arguments.length == 1) {
        if (arguments[0] instanceof Function) {
            typeFn = arguments[0];
        }
        else {
            options = arguments[0];
        }
    }
    else if (arguments.length == 2) {
        typeFn = arguments[0];
        options = arguments[1];
    }
    
    return (ClassPrototype : Object, method : string | symbol, parameterIdx : number) => {
        const TargetConstructor = ClassPrototype.constructor;
        const MethodPrototype = ClassPrototype[method];
        
        if (!MethodPrototype[MapSymbol]) {
            MethodPrototype[MapSymbol] = {
                config: {},
                parameters: {},
            };
        }
        
        if (!typeFn) {
            const ParamTypes = Reflect.getMetadata('design:paramtypes', ClassPrototype, method);
            typeFn = () => ParamTypes[parameterIdx];
        }
        
        MethodPrototype[MapSymbol].parameters[parameterIdx] = {
            typeFn,
            applyMapping: true,
            ...options
        };
    };
}

export { Map };

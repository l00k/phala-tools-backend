import { MapSymbol } from '../def';


function Getter<T> (
    getterFn : Function
) : ParameterDecorator
{
    return (ClassPrototype : Object, method : string | symbol, parameterIdx : number) => {
        const TargetConstructor = ClassPrototype.constructor;
        const MethodPrototype = ClassPrototype[method];
        
        if (!MethodPrototype[MapSymbol]) {
            MethodPrototype[MapSymbol] = {
                config: {},
                parameters: {},
            };
        }
        
        if (!MethodPrototype[MapSymbol].parameters[parameterIdx]) {
            MethodPrototype[MapSymbol].parameters[parameterIdx] = {};
        }
        
        MethodPrototype[MapSymbol].parameters[parameterIdx].getterFn = getterFn;
    };
}

export { Getter };

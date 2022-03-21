import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import merge from 'lodash/merge';
import { MapSymbol, MethodMapOptions, ParamMapOptions } from '../def';


export function ApplyGetter () : MethodDecorator
{
    return (Target : any, method : string | symbol, descriptor : PropertyDescriptor) => {
        const [ ClassConstructor, ClassPrototype ] = getDecoratorTarget(Target);
        const MethodProto = ClassPrototype[method];
        
        // collect default mapping
        if (!MethodProto[MapSymbol]) {
            MethodProto[MapSymbol] = {
                config: {},
                parameters: {},
            };
        }
        
        const methodMapping : MethodMapOptions = MethodProto[MapSymbol];
        
        // apply patch to method
        const originalMethod = descriptor.value;
        
        descriptor.value = async function(...params : any[]) {
            const getParams : any = [ ...params ];
            
            for (const parameterIdx in methodMapping.parameters) {
                const mergedMapOptions : ParamMapOptions = merge(
                    {},
                    { config: methodMapping.config },
                    methodMapping.parameters[parameterIdx]
                );
                
                // resolve getter
                if (mergedMapOptions.getterFn) {
                    getParams[parameterIdx] = await mergedMapOptions.getterFn.call(this, ...params);
                }
            }
            
            return originalMethod.apply(this, getParams);
        };
    };
}

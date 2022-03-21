import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import merge from 'lodash/merge';
import { MapSymbol, MethodMapOptions, ParamMapOptions } from '../def';
import { defaultMappingFunction } from '../defaultMappingFunction';


export function ApplyMapping (
    options : Partial<MethodMapOptions> = {}
) : MethodDecorator
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
        merge(methodMapping, options);
        
        // apply patch to method
        const originalMethod = descriptor.value;
        
        descriptor.value = async function(...params : any[]) {
            const mappedParams : any = [ ...params ];
            
            for (const parameterIdx in methodMapping.parameters) {
                const mergedMapOptions : ParamMapOptions = merge(
                    {},
                    { customMapping: methodMapping.customMapping, config: methodMapping.config },
                    methodMapping.parameters[parameterIdx]
                );
                
                let value = params[parameterIdx];
                if (mergedMapOptions.applyMapping) {
                    const mappingFunction = mergedMapOptions.customMapping || defaultMappingFunction;
                    value = await mappingFunction(params[parameterIdx], mergedMapOptions);
                }
                
                mappedParams[parameterIdx] = value;
            }
            
            return originalMethod.apply(this, mappedParams);
        };
    };
}

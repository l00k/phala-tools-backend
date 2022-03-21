import { ClassConstructor, plainToInstance } from 'class-transformer';
import { ParamMapOptions } from './def';
import { MappingException } from './MappingException';

export function defaultMappingFunction (plainValue : any, mapOptions : ParamMapOptions)
{
    if ([ null, undefined ].includes(plainValue)) {
        return plainValue;
    }
    
    try {
        const Type : ClassConstructor<any> = <any> mapOptions.typeFn();
        
        if (plainValue instanceof Type) {
            return plainValue;
        }
        else {
            return plainToInstance(Type, plainValue, mapOptions.config);
        }
    }
    catch (e) {
        /* istanbul ignore next */
        throw new MappingException(<any>e);
    }
}

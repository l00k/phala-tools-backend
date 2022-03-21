import { ObjectManager } from '@inti5/object-manager';
import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import { cacheKey, EntryConfig } from '../def';
import { RuntimeCache } from '../RuntimeCache';

function Cache (
    config : EntryConfig = {},
    runtimeCacheKey : string = 'global'
) : MethodDecorator
{
    return (Target : any, propertyName : string | symbol, descriptor : PropertyDescriptor) => {
        const [ ClassConstructor, ClassPrototype ] = getDecoratorTarget(Target);
        
        const serviceKey = cacheKey + runtimeCacheKey;
        const runtimeCache : RuntimeCache = ObjectManager.getSingleton().getService(serviceKey, RuntimeCache);
        
        const originalMethod = descriptor.value;
        descriptor.value = async function(...args : any[]) {
            const entryKey = [ ClassConstructor.name, propertyName, args ];
            return runtimeCache.get(
                entryKey,
                () => originalMethod.apply(this, args),
                config
            );
        };
    };
}


export { Cache };

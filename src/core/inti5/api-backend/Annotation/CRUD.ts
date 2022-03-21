import { MetadataStorage, TypeFn } from '@inti5/api';
import { ObjectManager } from '@inti5/object-manager';
import { RuntimeException } from '@inti5/utils/Exception';
import pluralize from 'pluralize';
import { Collection } from '../Domain';
import { Service } from '../Service';
import { Endpoint } from './Endpoint';

export const CRUD = {
    GetItem: function(typeFn : TypeFn, path? : string) : MethodDecorator {
        return (ClassPrototype : any, propertyKey : string | symbol, descriptor : PropertyDescriptor) => {
            const api = ObjectManager.getSingleton().getInstance(Service);
            const metadataStorage = ObjectManager.getSingleton().getInstance(MetadataStorage);
            
            const Type = typeFn();
            
            const resource = metadataStorage.resources.get(Type);
            if (!resource) {
                throw new RuntimeException('Resource not defined', 1641370923242);
            }
            
            if (!path) {
                path = resource.path + '/:id';
            }
            
            const context = {
                endpoint: resource.name,
                targetResourceType: Type,
            };
            
            Endpoint(path, { requestMethod: 'GET' })(ClassPrototype, propertyKey, descriptor);
            
            // wrap with serialization
            const originalMethod = descriptor.value;
            descriptor.value = async function(...args : any[]) {
                const result = await originalMethod.apply(this, args);
                return api.serialize(result, context);
            };
        };
    },
    GetCollection: function(typeFn : TypeFn, path? : string) : MethodDecorator {
        return (ClassPrototype : any, propertyKey : string | symbol, descriptor : PropertyDescriptor) => {
            const api = ObjectManager.getSingleton().getInstance(Service);
            const metadataStorage = ObjectManager.getSingleton().getInstance(MetadataStorage);
            const Type = typeFn();
            
            const resource = metadataStorage.resources.get(Type);
            if (!resource) {
                throw new RuntimeException('Resource not defined', 1641370923242);
            }
            
            if (!path) {
                path = pluralize(resource.path);
            }
            
            const context = {
                endpoint: resource.name,
                targetResourceType: Type,
            };
            
            Endpoint(path, { requestMethod: 'POST' })(ClassPrototype, propertyKey, descriptor);
            
            // wrap with serialization
            const originalMethod = descriptor.value;
            descriptor.value = async function(...args : any[]) {
                const result : Collection<any> = await originalMethod.apply(this, args);
                result.items = await api.serialize(result.items, context);
                return result;
            };
        };
    }
};

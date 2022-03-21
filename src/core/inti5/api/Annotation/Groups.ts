import { ObjectManager } from '@inti5/object-manager';
import { MetadataStorage } from '../MetadataStorage';

export function Groups (groups : string[]) : PropertyDecorator
{
    return (ClassPrototype : any, property : string | symbol) => {
        const api = ObjectManager.getSingleton().getInstance(MetadataStorage);
        
        api.registerProperty(
            ClassPrototype.constructor,
            property,
            { expose: { groups } }
        );
    };
}


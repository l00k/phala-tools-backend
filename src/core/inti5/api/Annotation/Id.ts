import { ObjectManager } from '@inti5/object-manager';
import { MetadataStorage } from '../MetadataStorage';


function Id () : PropertyDecorator
{
    return (ClassPrototype : any, property : string | symbol) => {
        const api = ObjectManager.getSingleton().getInstance(MetadataStorage);
        
        api.registerProperty(
            ClassPrototype.constructor,
            property,
            {
                id: true,
                type: true,
                expose: { groups: [ '*' ] }
            }
        );
    };
}

export { Id };

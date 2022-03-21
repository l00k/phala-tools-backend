import { ObjectManager } from '@inti5/object-manager';
import { MetadataStorage } from '../MetadataStorage';
import { SerializationProcessorOptions } from '../def';



function Serializer (options? : SerializationProcessorOptions) : ClassDecorator
{
    options = options ?? {};
    
    return (ClassConstructor : Function) => {
        const api = ObjectManager.getSingleton().getInstance(MetadataStorage);
        
        api.registerSerializer(
            ClassConstructor,
            options
        );
    };
}

export { Serializer };

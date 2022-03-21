import { ObjectManager } from '@inti5/object-manager';
import { DeserializationProcessorOptions } from '../def';
import { MetadataStorage } from '../MetadataStorage';



function Deserializer (options? : DeserializationProcessorOptions) : ClassDecorator
{
    options = options ?? {};
    
    return (ClassConstructor : Function) => {
        const api = ObjectManager.getSingleton().getInstance(MetadataStorage);
        
        api.registerDeserializer(
            ClassConstructor,
            options
        );
    };
}

export { Deserializer };

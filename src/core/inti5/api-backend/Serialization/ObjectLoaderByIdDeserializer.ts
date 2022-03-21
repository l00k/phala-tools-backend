import { Deserializer } from '@inti5/api/Annotation/Deserializer';
import { DeserializationProcessor } from '@inti5/api/Serialization/DeserializationProcessor';
import * as Def from '../def';


@Deserializer({
    priority: -100
})
export class ObjectLoaderByIdDeserializer
    extends DeserializationProcessor
{
    
    public async process (
        inputData : any,
        context : Def.SerializationContext,
        options? : Def.SerializationOptions,
    ) : Promise<any>
    {
        // todo ld 2022-01-06 09:46:01
        return inputData;
    }
    
}

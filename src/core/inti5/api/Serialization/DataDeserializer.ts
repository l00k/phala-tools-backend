import { RuntimeException } from '@inti5/utils/Exception';
import { replaceRecursive } from '@inti5/utils/replaceRecursive';
import * as Trans from 'class-transformer';
import { Deserializer } from '../Annotation/Deserializer';
import * as Def from '../def';
import { DeserializationProcessor } from './DeserializationProcessor';


@Deserializer({
    priority: 0
})
export class DataDeserializer
    extends DeserializationProcessor
{
    
    public async process (
        inputData : any,
        context : Def.SerializationContext,
        options? : Def.SerializationOptions,
    ) : Promise<any>
    {
        const typeFromData = inputData[Def.TYPE_APIKEY];
        if (!typeFromData) {
            return inputData;
        }
        
        const ResourceConstructor = <any>this.metadataStorage.resourcesNameMap[typeFromData];
        if (!ResourceConstructor) {
            throw new RuntimeException(`Undefined resource of type ${typeFromData}`, 1639594634016);
        }
        
        const description = this.metadataStorage.resources.get(ResourceConstructor);
        
        const serializationGroups = this.buildSerializationGroupsFromContext(
            context,
            Def.SerializationAccessor.Set
        );
        
        const finalOptions = replaceRecursive<Trans.ClassTransformOptions>(
            {},
            description.transformOptions,
            { groups: serializationGroups },
            options?.transformOptions
        );
        
        return Trans.plainToInstance(ResourceConstructor, inputData, finalOptions);
    }
    
}

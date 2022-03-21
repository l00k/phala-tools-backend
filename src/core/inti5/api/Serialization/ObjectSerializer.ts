import { mergeRecursive } from '@inti5/utils/mergeRecursive';
import * as Trans from 'class-transformer';
import difference from 'lodash/difference';
import { Serializer } from '../Annotation/Serializer';
import * as Def from '../def';
import { SerializationProcessor } from './SerializationProcessor';


@Serializer({
    priority: 0
})
export class ObjectSerializer
    extends SerializationProcessor
{
    
    public async process (
        inputData : any,
        context : Def.SerializationContext,
        options? : Def.SerializationOptions
    ) : Promise<any>
    {
        if (!inputData?.constructor) {
            // non serializable value
            return inputData;
        }
        
        const description = this.metadataStorage.resources.get(inputData.constructor);
        if (!description) {
            // non serializable value
            return inputData;
        }
        
        const serializationGroups = this.buildSerializationGroupsFromContext(
            context,
            Def.SerializationAccessor.Get
        );
        
        const finalOptions = mergeRecursive(
            {},
            description.transformOptions,
            { groups: serializationGroups },
            options?.transformOptions
        );
        
        const serialized = <any>Trans.instanceToPlain(inputData, finalOptions);
        
        // reduce to id string
        const allowedProps = [ description.idProperty, Def.TYPE_APIKEY, Def.ID_APIKEY ];
        const keysDiff = difference(Object.keys(serialized), allowedProps);
        
        if (!keysDiff.length) {
            return '@' + serialized[Def.ID_APIKEY];
        }
        
        return serialized;
    }
    
}

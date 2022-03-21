import { Annotation as API, DeserializationProcessor } from '@inti5/api';
import { Inject } from '@inti5/object-manager';
import * as Def from '../def';
import { EntityRuntimeCache } from '../EntityRuntimeCache';


@API.Deserializer({
    priority: -100
})
export class FromCacheLoaderDeserializer
    extends DeserializationProcessor
{
    
    @Inject()
    protected entityRuntimeCache : EntityRuntimeCache;
    
    
    public async process (
        inputData : any,
        context : Def.SerializationContext,
        options? : Def.SerializationOptions,
    ) : Promise<any>
    {
        const idPath = inputData.substring(1);
        
        const cached = this.entityRuntimeCache.getCachedEntity(idPath);
        if (!cached) {
            return inputData;
        }
        
        return cached;
    }
    
    public canHandle (
        inputData : any,
        context : Def.SerializationContext
    ) : boolean
    {
        return !!context.targetResourceType
            && typeof inputData == 'string'
            && inputData[0] == '@';
    }
    
}

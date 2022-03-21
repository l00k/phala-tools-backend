import { Inject } from '@inti5/object-manager';
import { SerializationAccessor, SerializationContext } from '../def';
import { MetadataStorage } from '../MetadataStorage';

export abstract class CommonProcessor
{
    
    @Inject()
    protected metadataStorage : MetadataStorage;
    
    protected buildSerializationGroupsFromContext (
        context : SerializationContext,
        accessor : SerializationAccessor
    ) : string[]
    {
        const out : string[] = [
            '*:*:*',
            `*:*:${accessor}`,
            `${context.endpoint}:*:*`,
            `${context.endpoint}:*:${accessor}`,
        ];
        
        if (context.roles instanceof Array) {
            for (const role of context.roles) {
                out.push(`*:${role}:*`);
                out.push(`*:${role}:${accessor}`);
                out.push(`${context.endpoint}:${role}:*`);
                out.push(`${context.endpoint}:${role}:${accessor}`);
            }
        }
        
        return out;
    }
    
    public abstract canHandle (
        inputData : any,
        context : SerializationContext,
    ) : boolean;
    
}

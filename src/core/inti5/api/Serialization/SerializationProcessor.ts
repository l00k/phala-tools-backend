import { SerializationContext, SerializationOptions } from '../def';
import { CommonProcessor } from './CommonProcessor';

export abstract class SerializationProcessor
    extends CommonProcessor
{
    
    public abstract process (
        inputData : any,
        context : SerializationContext,
        options? : SerializationOptions
    ) : Promise<any>;
    
    public canHandle (
        inputData : any,
        context : SerializationContext,
    ) : boolean
    {
        return true;
    }
    
}

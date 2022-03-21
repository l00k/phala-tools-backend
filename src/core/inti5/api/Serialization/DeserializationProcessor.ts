import { isPlainObject } from '@inti5/utils/common';
import { SerializationContext, SerializationOptions } from '../def';
import { CommonProcessor } from './CommonProcessor';

export abstract class DeserializationProcessor
    extends CommonProcessor
{
    
    public abstract process (
        inputData : any,
        context : SerializationContext,
        options? : SerializationOptions,
    ) : Promise<any>;
    
    public canHandle (
        inputData : any,
        context : SerializationContext,
    ) : boolean
    {
        return inputData instanceof Object;
    }
    
}

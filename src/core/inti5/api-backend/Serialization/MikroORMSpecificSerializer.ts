import { Serializer } from '@inti5/api/Annotation/Serializer';
import { SerializationProcessor } from '@inti5/api/Serialization/SerializationProcessor';
import { Collection, ArrayCollection } from '@mikro-orm/core';
import { SerializationContext } from '../def';
import * as Def from '../def';


@Serializer({
    priority: -100
})
export class MikroORMSpecificSerializer
    extends SerializationProcessor
{
    
    public async process (
        inputData : any,
        context : Def.SerializationContext,
        options? : Def.SerializationOptions
    ) : Promise<any>
    {
        if (this.isCollection(inputData)) {
            return inputData.isInitialized()
                ? inputData.getItems()
                : [];
        }
        
        return inputData;
    }
    
    public canHandle (inputData : any, context : SerializationContext) : boolean
    {
        return this.isCollection(inputData);
    }
    
    protected isCollection (inputData : any) : inputData is Collection<any>
    {
        return inputData?.constructor?.name === 'Collection'
            && inputData.getItems instanceof Function;
    }
    
}

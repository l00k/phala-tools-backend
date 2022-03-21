import { Inject, ObjectManager, Singleton } from '@inti5/object-manager';
import { isKeyIterable, isPlainObject } from '@inti5/utils/common';
import { RuntimeException } from '@inti5/utils/Exception';
import { mergeRecursive } from '@inti5/utils/mergeRecursive';
import * as Trans from 'class-transformer';
import trim from 'lodash/trim';
import { TypeFn } from './def';
import * as Def from './def';
import cloneDeep from 'lodash/cloneDeep';
import { MetadataStorage } from './MetadataStorage';
import { DeserializationProcessor } from './Serialization/DeserializationProcessor';
import { SerializationProcessor } from './Serialization/SerializationProcessor';


@Singleton()
export class Service
{
    
    @Inject()
    protected metadataStorage : MetadataStorage;
    
    protected config : Def.ApiConfig;
    
    protected serializers : SerializationProcessor[] = [];
    protected deserializers : DeserializationProcessor[] = [];
    
    
    public getResources () : Map<Function, Def.ResourceDescription>
    {
        return this.metadataStorage.resources;
    }
    
    public getResourcesNameMap () : { [name : string] : Function }
    {
        return this.metadataStorage.resourcesNameMap;
    }
    
    /*
     * Bootstraping API
     */
    
    public bootstrap (config : Partial<Def.ApiConfig> = {})
    {
        this.config = {
            contextRoles: Object.values(Def.ContextRole),
            ...config
        };
        
        // create normalization services
        const objectManager = ObjectManager.getSingleton();
        
        this.serializers = [ ...this.metadataStorage.serializersRegistry.entries() ]
            .sort((a, b) => a[1].priority < b[1].priority ? -1 : 1)
            .map(([ NormalizerConstructor, options ]) => {
                return objectManager.getInstance(<any>NormalizerConstructor);
            });
        
        this.deserializers = [ ...this.metadataStorage.deserializersRegistry.entries() ]
            .sort((a, b) => a[1].priority < b[1].priority ? -1 : 1)
            .map(([ DenormalizerConstructor, options ]) => {
                return objectManager.getInstance(<any>DenormalizerConstructor);
            });
        
        // first round (checks and fallbacks)
        for (const [ ResConstructor, description ] of this.metadataStorage.resources.entries()) {
            const ResPrototype = ResConstructor.prototype;
            
            if (!description.name || !description.path) {
                throw new RuntimeException(`Resource ${ResPrototype.constructor.name} is not configured well`, 1639589537680);
            }
        }
        
        // apply decorators
        for (const [ ResConstructor, description ] of this.metadataStorage.resources.entries()) {
            const ResPrototype = ResConstructor.prototype;
            
            for (const [ property, config ] of Object.entries(description.properties)) {
                const groups = this.buildSerializationGroupsForProperty(
                    ResConstructor,
                    property,
                    config
                );
                
                const exposeOptions : Trans.ExposeOptions = {
                    ...config.expose,
                    groups,
                };
                Trans.Expose(exposeOptions)(ResPrototype, property);
                
                if (config.type && config.typeFn) {
                    Trans.Type(config.typeFn, config.type)(ResPrototype, property);
                }
                if (config.transform) {
                    Trans.Transform(config.transformFn, config.transform)(ResPrototype, property);
                }
            }
        }
    }
    
    
    /*
     * Serialization
     */
    
    public async deserialize<T> (
        rawData : any,
        context : Def.SerializationContext,
        options? : Def.SerializationOptions,
    ) : Promise<T>
    {
        if (!context.targetResourceType) {
            this.identifyTargetType(rawData, context);
        }
        
        let currentData : any = rawData;
        
        for (const deserializer of this.deserializers) {
            const shouldUse = deserializer.canHandle(currentData, context);
            if (!shouldUse) {
                continue;
            }
            
            // nesting
            if (currentData instanceof Array) {
                for (const [key, value] of currentData.entries()) {
                    currentData[key] = await this.deserialize(value, context, options);
                }
            }
            else if (currentData instanceof Object) {
                for (const [prop, value] of Object.entries(currentData)) {
                    const childContext = cloneDeep(context);
                    if (!(currentData instanceof Array)) {
                        childContext.targetResourceType = null;
                    }
                    
                    // try to update child context by resource description
                    if (context.targetResourceType) {
                        const targetResource = this.metadataStorage.resources.get(context.targetResourceType);
                        if (targetResource) {
                            const propertyDescription = targetResource.properties[prop];
                            if (propertyDescription?.typeFn) {
                                childContext.targetResourceType = propertyDescription.typeFn();
                            }
                        }
                    }
                
                    // execute deserialization on child with its own context
                    currentData[prop] = await this.deserialize(value, childContext, options);
                }
            }
        
            currentData = await deserializer.process(
                currentData,
                context,
                options
            );
        }
        
        return currentData;
    }
    
    public async serialize<T> (
        object : T,
        context : Def.SerializationContext,
        options? : Def.SerializationOptions
    ) : Promise<any>
    {
        let currentData : any = object;
        for (const serializer of this.serializers) {
            const shouldUse = serializer.canHandle(currentData, context);
            if (!shouldUse) {
                continue;
            }
            
            // nesting
            if (currentData instanceof Array) {
                for (const [key, value] of currentData.entries()) {
                    currentData[key] = await this.serialize(value, context, options);
                }
            }
            else if (currentData instanceof Object) {
                for (const [prop, value] of Object.entries(currentData)) {
                    const childContext = cloneDeep(context);
                    childContext.targetResourceType = null;
                    
                    // try to update child context by resource description
                    if (context.targetResourceType) {
                        const targetResource = this.metadataStorage.resources.get(context.targetResourceType);
                        if (targetResource) {
                            const propertyDescription = targetResource.properties[prop];
                            if (propertyDescription?.typeFn) {
                                childContext.targetResourceType = propertyDescription.typeFn();
                            }
                        }
                    }
                
                    // execute serialization on child with its own context
                    currentData[prop] = await this.serialize(value, childContext, options);
                }
            }
            
            currentData = await serializer.process(
                currentData,
                context,
                options
            );
        }
        
        return currentData;
    }
    
    protected identifyTargetType (
        inputData : any,
        context : Def.SerializationContext,
    ) : boolean
    {
        if (!(inputData instanceof Object)) {
            return false;
        }
    
        const typeFromData = inputData[Def.TYPE_APIKEY];
        if (!typeFromData) {
            return false;
        }
        
        const ResourceConstructor = <any>this.metadataStorage.resourcesNameMap[typeFromData];
        if (!ResourceConstructor) {
            return false;
        }
        
        context.targetResourceType = ResourceConstructor;
        
        return true;
    }
    
    protected buildSerializationGroupsForProperty (
        ResConstructor : Function,
        property : string | symbol,
        description : Def.PropertyDescription,
    ) : string[]
    {
        const out : Set<string> = new Set();
        
        const regex = /^(?<endpoint>[a-z0-9*]+)(:(?<role>[a-z0-9*]+)(:(?<accessor>[a-z0-9*]+))?)?$/i;
        
        for (const group of description.expose.groups) {
            const match = group.match(regex);
            if (!match) {
                throw new RuntimeException(
                    `Unable to parse serialization group ${group}`
                    + ` in ${ResConstructor.name}::${property.toString()}`,
                    1639499965219
                );
            }
            
            let { groups: { endpoint, role, accessor } } = match;
            
            if (!role) {
                role = '*';
            }
            if (!accessor) {
                accessor = '*';
            }
            
            out.add(`${endpoint}:${role}:${accessor}`);
        }
        
        return Array.from(out);
    }
    
}

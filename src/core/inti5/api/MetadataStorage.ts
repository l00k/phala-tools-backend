import * as Trans from 'class-transformer';
import snakeCase from 'lodash/snakeCase';
import trim from 'lodash/trim';
import { Singleton } from '../object-manager';
import { isPlainObject } from '../utils/common';
import { mergeRecursive } from '../utils/mergeRecursive';
import * as Def from './def';


@Singleton()
export class MetadataStorage
{
    
    public resources : Map<Function, Def.ResourceDescription> = new Map();
    public resourcesNameMap : { [name : string] : Function } = {};
    
    public serializersRegistry : Map<Function, Def.SerializationProcessorOptions> = new Map();
    public deserializersRegistry : Map<Function, Def.DeserializationProcessorOptions> = new Map();
    
    
    protected initResource (TargetConstructor : Function, property? : string | symbol)
    {
        if (!this.resources.get(TargetConstructor)) {
            const description : Def.ResourceDescription = {
                name: undefined,
                path: undefined,
                idProperty: undefined,
                transformOptions: {
                    strategy: 'excludeAll',
                    excludeExtraneousValues: true,
                    exposeDefaultValues: true,
                },
                properties: {},
            };
            
            this.resources.set(TargetConstructor, description);
        }
        
        if (property) {
            const resource = this.resources.get(TargetConstructor);
            if (!resource.properties[property]) {
                resource.properties[property] = {
                    expose: {
                        groups: [],
                    }
                };
            }
        }
    }
    
    public registerResource (
        TargetConstructor : Function,
        name : string,
        options : Def.ResourceOptions
    )
    {
        this.initResource(TargetConstructor);
        
        const storedConfig = this.resources.get(TargetConstructor);
        
        // merge with current config
        storedConfig.name = name ?? TargetConstructor.name;
        storedConfig.path = options.path ?? storedConfig.name;
        storedConfig.path = '/' + trim(snakeCase(storedConfig.path), '/');
        
        if (options.transform) {
            const transformOptions : Trans.ClassTransformOptions = isPlainObject(options.transform)
                ? <any>options.transform
                : {};
            storedConfig.transformOptions = mergeRecursive({}, storedConfig.transformOptions, transformOptions);
        }
        
        // add to name map
        this.resourcesNameMap[storedConfig.name] = <any>TargetConstructor;
        
        // define @type prop
        Object.defineProperty(
            TargetConstructor.prototype,
            Def.TYPE_APIKEY,
            { get () { return storedConfig.name; } }
        );
        this.registerProperty(TargetConstructor, Def.TYPE_APIKEY, {
            expose: {
                groups: [ '*' ]
            },
        });
        
        // define @id prop
        Object.defineProperty(TargetConstructor.prototype, Def.ID_APIKEY, {
            get ()
            {
                return storedConfig.idProperty
                    ? `${storedConfig.path}/${this[storedConfig.idProperty]}`
                    : undefined;
            }
        });
        this.registerProperty(TargetConstructor, Def.ID_APIKEY, {
            expose: {
                groups: [ '*' ]
            },
        });
    }
    
    public registerProperty (
        TargetConstructor : Function,
        property : string | symbol,
        options : Def.PropertyOptions,
    )
    {
        const TargetPrototype = TargetConstructor.prototype;
        
        this.initResource(TargetConstructor, property);
        
        const resourceConfig = this.resources.get(TargetConstructor);
        const propertyConfig = resourceConfig.properties[property];
        
        // merge config
        if (options.id) {
            resourceConfig.idProperty = property.toString();
        }
        
        if (options.expose) {
            const exposeOptions : Trans.ExposeOptions = isPlainObject(options.expose)
                ? <any>options.expose
                : {};
            propertyConfig.expose = <any>mergeRecursive({}, propertyConfig.expose, exposeOptions);
        }
        
        if (options.type) {
            const typeOptions : Trans.TypeOptions = isPlainObject(options.type)
                ? <any>options.type
                : {};
            
            if (!options.typeFn) {
                const Type = Reflect.getMetadata('design:type', TargetPrototype, property);
                options.typeFn = () => Type;
            }
            
            propertyConfig.type = <any>mergeRecursive({}, propertyConfig.type, typeOptions);
            propertyConfig.typeFn = options.typeFn;
        }
        
        if (options.transform) {
            propertyConfig.transformFn = options.transformFn;
            propertyConfig.transform = <any>mergeRecursive({}, propertyConfig.transform, options.transform);
        }
    }
    
    public registerSerializer (
        TargetConstructor : Function,
        options : Def.SerializationProcessorOptions
    )
    {
        this.serializersRegistry.set(TargetConstructor, options);
    }
    
    public registerDeserializer (
        TargetConstructor : Function,
        options : Def.DeserializationProcessorOptions
    )
    {
        this.deserializersRegistry.set(TargetConstructor, options);
    }
    
}

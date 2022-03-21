import { RuntimeException } from '@inti5/utils/Exception';
import { getPrototypesFromChain } from '@inti5/utils/getPrototypesFromChain';
import { ClassConstructor, InitializeSymbol, InjectableOptions, InjectionDescription, ReleaseSymbol } from './def';


type Mapped<T> = {
    [name : number | string | symbol] : T
}

type InjectableServices = {
    [tag : string] : {
        [key : string] : Object
    }
};

type Injections = Map<Object, { [propertyName : string | symbol] : InjectionDescription }>;

type Handler = (object : any, Type : ClassConstructor<any>) => any;


export class ObjectManager
{
    
    protected static readonly STORAGE_KEY = 'ObjectManager_N1Lkxd2DNNNWCPOUUOEBktEbvKzr6tmx';
    
    
    protected singletonRegistry : Map<ClassConstructor<any>, boolean> = new Map();
    protected injectableRegistry : Mapped<Mapped<() => Object>> = {};
    protected injectionRegistry : Injections = new Map();
    
    protected instances : Object[] = [];
    protected singletons : Map<Object, any> = new Map();
    protected injectables : Mapped<Mapped<Object>> = {};
    protected services : Mapped<Object> = {};
    
    protected handlers : Handler[] = [];
    
    
    public static getSingleton () : ObjectManager
    {
        if (!globalThis[ObjectManager.STORAGE_KEY]) {
            globalThis[ObjectManager.STORAGE_KEY] = new ObjectManager();
        }
        
        return globalThis[ObjectManager.STORAGE_KEY];
    }
    
    /*
     * Registrations
     */
    
    public registerInjection (
        Class : ClassConstructor<any>,
        propertyName : string | symbol,
        injectionDescription : InjectionDescription
    )
    {
        let targetInjections = this.injectionRegistry.get(Class);
        if (!targetInjections) {
            targetInjections = {};
            this.injectionRegistry.set(Class, targetInjections);
        }
        
        targetInjections[propertyName] = injectionDescription;
    }
    
    public registerSingleton (
        Class : ClassConstructor<any>
    )
    {
        this.singletonRegistry.set(Class, true);
    }
    
    public registerInjectable (
        Class : ClassConstructor<any>,
        injectableOptions : InjectableOptions
    )
    {
        const ctorArgs = injectableOptions.ctorArgs || [];
        
        if (injectableOptions.tag) {
            if (!this.injectableRegistry[injectableOptions.tag]) {
                this.injectableRegistry[injectableOptions.tag] = {};
            }
            
            const key = injectableOptions.key || Object.values(this.injectableRegistry[injectableOptions.tag]).length;
            const getter = () => this.createInstance(Class, ctorArgs);
            
            this.injectableRegistry[injectableOptions.tag][key] = getter;
        }
    }
    
    public registerHandler (handler : Handler)
    {
        this.handlers.push(handler);
    }
    
    
    /*
     * Factory
     */
    
    public getInstance<T> (
        Class : ClassConstructor<T>,
        ctorArgs : any[] = []
    ) : T
    {
        const isSingleton = this.singletonRegistry.has(Class);
        if (isSingleton) {
            if (!this.singletons.has(Class)) {
                const singleton = this.createInstance(Class, ctorArgs);
                this.singletons.set(Class, singleton);
            }
            
            return this.singletons.get(Class);
        }
        
        return this.createInstance(Class, ctorArgs);
    }
    
    public getService<T> (
        name : string,
        Class? : ClassConstructor<T>,
        ctorArgs : any[] = []
    ) : T
    {
        if (!this.services[name]) {
            if (!Class) {
                throw new RuntimeException(`Instance named as ${name} hasn't been bonded yet`, 1639229144394);
            }
            
            this.services[name] = this.createInstance(Class, ctorArgs);
        }
        
        return <any>this.services[name];
    }
    
    public getInjectables (tag : string) : Mapped<Object>
    {
        if (!this.injectables[tag]) {
            this.injectables[tag] = {};
        }
        
        for (const key in this.injectableRegistry[tag]) {
            if (!this.injectables[tag][key]) {
                this.injectables[tag][key] = this.injectableRegistry[tag][key]();
            }
        }
        
        return this.injectables[tag];
    }
    
    public bindService (service : any, name : string) : void
    {
        if (this.services[name]) {
            throw new RuntimeException(`Instance named as ${name} already has been bonded`, 1639229136537);
        }
        
        this.services[name] = service;
    }
    
    protected createInstance<T> (
        Class : ClassConstructor<T>,
        ctorArgs : any[] = []
    ) : T
    {
        const object = new Class(...ctorArgs);
        
        // load dependencies
        const TargetPrototype = Class.prototype;
        this.loadDependencies(object, TargetPrototype);
        
        // initialize
        if (object[InitializeSymbol]) {
            object[InitializeSymbol]();
        }
        
        this.instances.push(object);
        
        return object;
    }
    
    public loadDependencies<T> (
        object : T,
        Prototype : Object
    )
    {
        const targetInjections = getPrototypesFromChain(Prototype)
            .reduce((acc, Prototype) => {
                const nodeInjections = this.injectionRegistry.get(Prototype.constructor);
                return { ...nodeInjections, ...acc };
            }, {});
        
        for (const propertyName in targetInjections) {
            const injection : InjectionDescription = targetInjections[propertyName];
            
            if (injection.name) {
                object[propertyName] = this.getService(injection.name, injection.type, injection.ctorArgs);
            }
            else if (injection.tag) {
                object[propertyName] = this.getInjectables(injection.tag);
            }
            else {
                object[propertyName] = this.getInstance(injection.type, injection.ctorArgs);
            }
        }
        
        // external handlers
        this.handlers.forEach(handler => handler(object, <any> Prototype.constructor));
    }
    
    public async releaseAll ()
    {
        for (const service of Object.values(this.services)) {
            if (service?.[ReleaseSymbol]) {
                await service[ReleaseSymbol]();
            }
        }
        this.services = {};
        
        for (const [ tag, instances ] of Object.entries(this.injectables)) {
            for (const [ key, instance ] of Object.entries(instances)) {
                if (instance[ReleaseSymbol]) {
                    await instance[ReleaseSymbol]();
                }
            }
        }
        this.injectables = {};
        
        for (const instance of this.instances) {
            if (instance[ReleaseSymbol]) {
                await instance[ReleaseSymbol]();
            }
        }
        this.instances = [];
        this.singletons = new Map();
    }
    
}

import { isPlainObject } from '@inti5/utils/common';
import { RuntimeException } from '@inti5/utils/Exception';
import { getPrototypesFromChain } from '@inti5/utils/getPrototypesFromChain';
import { replaceRecursive } from '@inti5/utils/replaceRecursive';
import { InjectionDescription } from './def';


type ClassInjections = { [propertyName : string | symbol] : InjectionDescription };
type Injections = Map<Function, ClassInjections>;

type ConfigurationData = {
    [path : string] : any,
};


export class Configuration
{
    
    protected static readonly STORAGE_KEY = 'Configuration_PEnYeG173bC1z4qmnXP8l3UXoYEIa1Ar';
    
    
    protected injections : Injections = new Map();
    
    protected data : ConfigurationData = {};
    
    
    public static getSingleton () : Configuration
    {
        if (!globalThis[Configuration.STORAGE_KEY]) {
            globalThis[Configuration.STORAGE_KEY] = new Configuration();
        }
        
        return globalThis[Configuration.STORAGE_KEY];
    }
    
    public injectConfigurationValues<T> (
        object : T,
        TargetConstructor? : Function
    )
    {
        if (!TargetConstructor) {
            TargetConstructor = <any> object.constructor;
        }
    
        getPrototypesFromChain(TargetConstructor.prototype)
            .reverse()
            .forEach(Prototype => {
                const injections = this.injections.get(<any> Prototype.constructor);
                if (injections) {
                    for (const propertyName in injections) {
                        const injection : InjectionDescription = injections[propertyName];
                        object[propertyName] = this.get(injection.configPath, injection.defaultValue);
                    }
                }
            });
    }
    
    public registerInjection (
        TargetConstructor : Function,
        propertyName : string | symbol,
        injectionDescription : InjectionDescription
    )
    {
        let targetInjections = this.injections.get(TargetConstructor);
        if (!targetInjections) {
            targetInjections = {};
            this.injections.set(TargetConstructor, targetInjections);
        }
        
        targetInjections[propertyName] = injectionDescription;
    }
    
    
    public load (data : any, path : string = '')
    {
        this.createFlatData(path, data);
    }
    
    protected createFlatData (path : string, tree : any)
    {
        for (let idx in tree) {
            let nodePath = path + (path ? '.' : '') + idx;
            
            if (isPlainObject(this.data[nodePath])) {
                replaceRecursive(this.data[nodePath], tree[idx]);
            }
            else {
                this.data[nodePath] = tree[idx];
            }
            
            if (typeof tree[idx] == 'object') {
                this.createFlatData(nodePath, tree[idx]);
            }
        }
    }
    
    
    public get<T> (path : string, defaultValue ? : any) : T
    {
        if (!this.data[path]) {
            if (defaultValue === undefined) {
                throw new RuntimeException(`Configuration [${path}] not found and default value not defined.`, 1572874195282);
            }
            else {
                return defaultValue;
            }
        }
        
        return this.data[path];
    }
    
}

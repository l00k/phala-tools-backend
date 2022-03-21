import { Configuration } from '../Configuration';
import { InjectionDescription } from '../def';


export function Config (
    configPath : string,
    defaultValue : any = undefined
) : PropertyDecorator {
    return (ClassPrototype : any, propertyKey : string | symbol) => {
        const description = new InjectionDescription();
        Object.assign(description, { configPath, defaultValue });
        
        Configuration.getSingleton()
            .registerInjection(ClassPrototype.constructor, propertyKey, description);
    };
}


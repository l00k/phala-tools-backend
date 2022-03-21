import { InjectionDescription, InjectOptions } from '../def';
import { ObjectManager } from '../ObjectManager';


export function Inject(options?: InjectOptions) : PropertyDecorator
{
    return (ClassPrototype : any, propertyName : string|symbol) => {
        const Type = Reflect.getMetadata('design:type', ClassPrototype, propertyName);

        const description = new InjectionDescription(Type);
        Object.assign(description, options);

        ObjectManager.getSingleton()
            .registerInjection(ClassPrototype.constructor, propertyName, description);
    };
}


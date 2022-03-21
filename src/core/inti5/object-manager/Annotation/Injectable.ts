import { InjectableOptions } from '../def';
import { ObjectManager } from '../ObjectManager';


export function Injectable (
    options? : InjectableOptions
) : ClassDecorator {
    return (ClassConstructor : any) => {
        ObjectManager.getSingleton()
            .registerInjectable(ClassConstructor, options);
    };
}

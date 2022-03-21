import { ObjectManager } from '../ObjectManager';


export function DependencyInjection<T>() : ClassDecorator
{
    return (ClassConstructor : any) => {
        // @ts-ignore
        const ExtClass = class extends ClassConstructor
        {
            constructor(...ctorArgs : any[])
            {
                super(...ctorArgs);

                ObjectManager.getSingleton()
                    .loadDependencies<T>(<any> this, ClassConstructor.prototype);
            }
        };

        // copy static variables
        Object.assign(ExtClass, ClassConstructor);

        // assign name
        Object.defineProperty(ExtClass, 'name', { value: ClassConstructor.name });

        return <any> ExtClass;
    };
}

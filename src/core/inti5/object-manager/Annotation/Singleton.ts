import { ObjectManager } from '../ObjectManager';


export function Singleton<T> () : ClassDecorator {
    return (ClassConstructor : any) => {
        ObjectManager.getSingleton()
            .registerSingleton(ClassConstructor);
    };
}


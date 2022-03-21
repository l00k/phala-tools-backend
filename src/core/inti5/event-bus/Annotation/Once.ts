import { ObjectManager } from '@inti5/object-manager';
import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import { eventListenerKey } from '../def';
import { EventBus } from '../EventBus';


function Once (
    eventName : string,
    listenerName : string = 'global'
) : MethodDecorator
{
    return (Target : any, method : string | symbol, descriptor : PropertyDescriptor) => {
        const [ ClassConstructor, ClassPrototype ] = getDecoratorTarget(Target);
        
        const listenerServiceName = eventListenerKey + listenerName;
        const eventBus = ObjectManager.getSingleton()
            .getService(listenerServiceName, EventBus);
        
        eventBus.bindListener(
            'once',
            eventName,
            descriptor.value,
            ClassConstructor
        );
    };
}

export { Once };

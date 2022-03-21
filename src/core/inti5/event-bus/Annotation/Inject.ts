import * as OM from '@inti5/object-manager';
import { eventListenerKey } from '../def';
import { EventBus } from '../EventBus';


function Inject (
    name : string = 'global'
) : PropertyDecorator
{
    return (ClassPrototype : any, propertyName : string | symbol) => {
        const listenerKey = eventListenerKey + name;
        
        OM.Inject({
            name: listenerKey,
            type: EventBus,
        })(ClassPrototype, propertyName);
    };
}


export { Inject };

import { ObjectManager } from '@inti5/object-manager';
import isEmpty from 'lodash/isEmpty';
import JsEventBus from 'js-event-bus';
import { ListenerType } from './def';


type Callback = (data : any) => any;

type Listners = {
    [eventName : string] : Callback[]
};


export class EventBus
{

    protected eventBus : JsEventBus;

    protected observers : Map<Function, Object> = new Map();

    protected onListeners : Listners = {};


    public constructor ()
    {
        this.eventBus = new JsEventBus();
    }
    
    public bindListener(
        type : ListenerType,
        eventName : string,
        callee : Callback,
        observerClass? : Function
    )
    {
        if (observerClass) {
            let observer = this.observers.get(observerClass);
            if (!observer) {
                const objectManager = ObjectManager.getSingleton();

                observer = objectManager.getInstance(<any> observerClass.constructor);
                this.observers.set(observerClass, observer);
            }

            callee.bind(observer);
        }

        this.eventBus[type](eventName, callee);
    }

    public async emit(eventName : string, ...data : any[])
    {
        await this.eventBus.emit(eventName, null, ...data);
    }

}

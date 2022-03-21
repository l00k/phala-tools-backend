import { ObjectManager } from '@inti5/object-manager';
import * as EBus from '../index';

describe('Event bus', () => {
    afterEach(() => {
        delete globalThis[(<any>ObjectManager).STORAGE_KEY];
    });
    
    test('Global event bus test', () => {
        let spy = jest.fn();
    
        class SampleListener {
            @EBus.On('click')
            public onClick()
            {
                spy(...arguments);
            }
        }
        
        class SampleTrigger {
            @EBus.Inject()
            protected eventBus : EBus.EventBus;
            
            public trigger(...args : any[])
            {
                this.eventBus.emit('click', ...args);
            }
        }
        
        const objectManager = ObjectManager.getSingleton();
        const instance = objectManager.getInstance(SampleTrigger);
        
        instance.trigger('test', 'ing')
        expect(spy)
            .toBeCalledWith('test', 'ing');
    });
    
    test('Custom event bus test', () => {
        let spy = jest.fn();
    
        class SampleListener {
            @EBus.On('click', 'custom')
            public onClick()
            {
                spy(...arguments);
            }
        }
        
        class SampleTrigger {
            @EBus.Inject('custom')
            protected eventBus : EBus.EventBus;
            
            public trigger(...args : any[])
            {
                this.eventBus.emit('click', ...args);
            }
        }
        
        const objectManager = ObjectManager.getSingleton();
        const instance = objectManager.getInstance(SampleTrigger);
        
        instance.trigger('test', 'ing')
        expect(spy)
            .toBeCalledWith('test', 'ing');
    });
    
    test('Once test', () => {
        let spy = jest.fn();
    
        class SampleListener {
            @EBus.Once('click')
            public onClick()
            {
                spy(...arguments);
            }
        }
        
        class SampleTrigger {
            @EBus.Inject()
            protected eventBus : EBus.EventBus;
            
            public trigger(...args : any[])
            {
                this.eventBus.emit('click', ...args);
            }
        }
        
        const objectManager = ObjectManager.getSingleton();
        const instance = objectManager.getInstance(SampleTrigger);
        
        instance.trigger('test', 'ing')
        instance.trigger('test', 'ing')
        
        expect(spy)
            .toBeCalledTimes(1)
            .toBeCalledWith('test', 'ing');
    });
    
});

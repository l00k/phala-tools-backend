import { ObjectManager } from '@inti5/object-manager';
import { Config, Configuration } from '../index';

describe('Configuration', () => {
    afterEach(() => {
        delete globalThis[(<any>ObjectManager).STORAGE_KEY];
        delete globalThis[(<any>Configuration).STORAGE_KEY];
    });
    
    test('Merge configuration data', () => {
        const configuration = Configuration.getSingleton();
    
        configuration.load({
            module: {
                bar: 1,
                foo: [ 'a', 'b' ],
                que: true,
            }
        });
        
        configuration.load({
            module: {
                bar: 2,
                foo: [ 'c' ],
            }
        });
        
        expect(configuration.get('module.bar'))
            .toStrictEqual(2);
        expect(configuration.get('module.foo'))
            .toStrictEqual([ 'c' ]);
        expect(configuration.get('module.que'))
            .toStrictEqual(true);
    });
    
    test('Basic configuraiton injection', () => {
        const configuration = Configuration.getSingleton();
    
        class Sample {
            @Config('module.foo.bars')
            public bars : string[];
        }
        
        configuration.load({
            module: {
                foo: {
                    bars: [
                        'one',
                        'two',
                        'three',
                    ]
                },
                bars: 'other-sample'
            }
        });
        
        const object = new Sample();
        configuration.injectConfigurationValues(object);
        
        expect(object.bars)
            .toStrictEqual([ 'one', 'two', 'three' ]);
    });
    
    test('Inherited configuration variable', () => {
        const configuration = Configuration.getSingleton();
    
        class Base {
            @Config('module.foo')
            public primary : number;
            
            @Config('module.que')
            public secondary : number;
        }
    
        class Child
            extends Base
        {
            @Config('module.bar')
            public primary : number = null;
        }
        
        configuration.load({
            module: {
                foo: 1,
                bar: 2,
                que: 3
            }
        });
        
        const object = new Child();
        configuration.injectConfigurationValues(object);
        
        expect(object)
            .toMatchObject({
                primary: 2,
                secondary: 3,
            });
    });
    
    test('Default value', () => {
        const configuration = Configuration.getSingleton();
    
        class Sample {
            @Config('module.foo', 5)
            public primary : number;
        }
    
        configuration.load({
            module: {
                bar: 1,
            }
        });
        
        const object = new Sample();
        configuration.injectConfigurationValues(object);
        
        expect(object)
            .toMatchObject({
                primary: 5,
            });
    });
    
    test('Throw error on missing value', () => {
        const configuration = Configuration.getSingleton();
    
        class Sample {
            @Config('module.foo')
            public primary : number;
        }
    
        configuration.load({
            module: {
                bar: 1,
            }
        });
        
        const object = new Sample();
        
        const fn = () => configuration.injectConfigurationValues(object);
        
        expect(fn)
            .toThrow();
    });
});

import { InitializeSymbol, Injectable, ObjectManager, ReleaseSymbol, Singleton } from '../index';
import { RuntimeException } from '@inti5/utils/Exception';


describe('Direct requests', () => {
    afterEach(() => {
        delete globalThis[(<any>ObjectManager).STORAGE_KEY];
    });
    
    
    test('Self Singleton', () => {
        const first = ObjectManager.getSingleton();
        expect(ObjectManager.getSingleton())
            .toStrictEqual(first);
    });
    
    test('Handlers', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Sample
        {
            public constructor (
                public a,
            )
            {}
        }
        
        objectManager.registerHandler((object : Sample, Type) => {
            object.a = true;
        });
        expect(objectManager.getInstance(Sample))
            .toMatchObject({ a: true });
    });
    
    test('getInstance() simple object', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Sample
        {
            public constructor (
                public a,
            )
            {}
        }
        
        const a = objectManager.getInstance(Sample, [ 1 ]);
        expect(a)
            .toBeInstanceOf(Sample)
            .toMatchObject({ a: 1 });
        
        const b = objectManager.getInstance(Sample, [ 2 ]);
        expect(b)
            .toBeInstanceOf(Sample)
            .not.toStrictEqual(a);
    });
    
    test('getInstance() with initialization', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Sample
        {
            public a;
            
            public [InitializeSymbol] ()
            {
                this.a = 1;
            }
        }
        
        const a = objectManager.getInstance(Sample);
        expect(a)
            .toBeInstanceOf(Sample)
            .toMatchObject({ a: 1 });
    });
    
    test('getInstance() singleton object', () => {
        const objectManager = ObjectManager.getSingleton();
        
        @Singleton()
        class Sample
        {
            public constructor (
                public a,
            )
            {}
        }
        
        const a = objectManager.getInstance(Sample, [ 1 ]);
        expect(a)
            .toBeInstanceOf(Sample)
            .toMatchObject({ a: 1 });
        
        const b = objectManager.getInstance(Sample, [ 2 ]);
        expect(b)
            .toBeInstanceOf(Sample)
            .toStrictEqual(a);
    });
    
    test('getInjectables() without specified key', () => {
        const objectManager = ObjectManager.getSingleton();
        
        @Injectable({
            tag: 'tag',
            ctorArgs: [ 1 ],
        })
        class Sample1
        {
            public constructor (
                public a
            )
            {}
        }
        
        @Injectable({
            tag: 'tag',
            ctorArgs: [ 2 ],
        })
        class Sample2
        {
            public constructor (
                public a
            )
            {}
        }
        
        const { 0: instance1, 1: instance2 } = objectManager.getInjectables('tag');
        
        expect(instance1)
            .toBeInstanceOf(Sample1)
            .toMatchObject({ a: 1 });
        
        expect(instance2)
            .toBeInstanceOf(Sample2)
            .toMatchObject({ a: 2 });
    });
    
    test('getInjectables() with specified key', () => {
        const objectManager = ObjectManager.getSingleton();
        
        @Injectable({
            tag: 'tag',
            ctorArgs: [ 1 ],
            key: 'main'
        })
        class Sample1
        {
            public constructor (
                public a
            )
            {}
        }
        
        @Injectable({
            tag: 'tag',
            ctorArgs: [ 2 ],
        })
        class Sample2
        {
            public constructor (
                public a
            )
            {}
        }
        
        const { main: instance1, 1: instance2 } = objectManager.getInjectables('tag');
        
        expect(instance1)
            .toBeInstanceOf(Sample1)
            .toMatchObject({ a: 1 });
        
        expect(instance2)
            .toBeInstanceOf(Sample2)
            .toMatchObject({ a: 2 });
    });
    
    test('getService() service defined', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Sample
        {
            public constructor (
                public a
            )
            {}
        }
        
        expect(() => objectManager.getService('sample'))
            .toThrow(RuntimeException);
        
        const sample = new Sample(1);
        objectManager.bindService(sample, 'sample');
        
        const result = objectManager.getService('sample');
        expect(result).toStrictEqual(sample);
        
        const sample2 = new Sample(2);
        expect(() => objectManager.bindService(sample2, 'sample'))
            .toThrow(RuntimeException);
        
        const result2 = objectManager.getService('sample');
        expect(result2).toStrictEqual(sample);
    });
    
    test('getService() service not defined', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Sample
        {
            public constructor (
                public a
            )
            {}
        }
        
        const service = objectManager.getService('sample', Sample, [ 1 ]);
        expect(service)
            .toBeInstanceOf(Sample)
            .toMatchObject({ a: 1 });
        
        const service2 = objectManager.getService('sample', Sample, [ 2 ]);
        expect(service2)
            .toBeInstanceOf(Sample)
            .toStrictEqual(service);
        
        const service3 = objectManager.getService('sample', Sample);
        expect(service3)
            .toBeInstanceOf(Sample)
            .toStrictEqual(service);
    });
    
    test('releaseAll()', async() => {
        const objectManager = ObjectManager.getSingleton();
        
        let initialized : string[] = [];
        let released : string[] = [];
        
        class Sample
        {
            public constructor (
                public name : string,
            )
            {}
            
            public [InitializeSymbol] ()
            {
                initialized.push(this.name);
            }
            
            public [ReleaseSymbol] ()
            {
                released.push(this.name);
            }
        }
        
        @Injectable({ tag: 'tag', ctorArgs: [ 'injectable1' ] })
        class Injectable1
            extends Sample {}
        
        @Injectable({ tag: 'tag', ctorArgs: [ 'injectable2' ] })
        class Injectable2
            extends Sample {}
        
        objectManager.getService('sample', Sample, [ 'sample' ]);
        objectManager.getService('sample2', Sample, [ 'sample2' ]);
        objectManager.getInjectables('tag');
        objectManager.getInstance(Sample, [ 'sample3' ]);
        
        await objectManager.releaseAll();
        
        expect(released)
            .toContain('sample')
            .toContain('sample2')
            .toContain('injectable1')
            .toContain('injectable2')
            .toContain('sample3');
        
        initialized = [];
        
        expect(() => objectManager.getService('sample')).toThrow();
        expect(() => objectManager.getService('sample2')).toThrow();
        
        objectManager.getInjectables('tag');
        expect(initialized)
            .toContain('injectable1')
            .toContain('injectable2');
    });
    
});

import {
    DependencyInjection,
    InitializeSymbol,
    Inject,
    Injectable,
    ObjectManager,
    ReleaseSymbol,
} from '../index';


describe('Dependency injection', () => {
    afterEach(() => {
        delete globalThis[(<any>ObjectManager).STORAGE_KEY];
    });
    
    
    test('Basic injections', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Dependency
        {
            public constructor (
                public a : number
            )
            {}
        }
        
        class Sample
        {
            @Inject()
            public dependency : Dependency;
        }
        
        const sample = objectManager.getInstance(Sample);
        
        expect(sample.dependency).toBeInstanceOf(Dependency);
    });
    
    test('Injections with ctor args', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Dependency
        {
            public constructor (
                public a : number
            )
            {}
        }
        
        class Sample
        {
            @Inject({ ctorArgs: [ 1 ] })
            public dependency : Dependency;
        }
        
        const sample = objectManager.getInstance(Sample);
        
        expect(sample.dependency).toBeInstanceOf(Dependency);
        expect(sample.dependency.a).toBe(1);
    });
    
    test('DependencyInjection() modifier', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Dependency
        {
            public constructor (
                public a : number
            )
            {}
        }
        
        @DependencyInjection()
        class Sample
        {
            @Inject({ ctorArgs: [ 1 ] })
            public dependency : Dependency;
        }
        
        const sample = new Sample();
        
        expect(sample.dependency).toBeInstanceOf(Dependency);
        expect(sample.dependency.a).toBe(1);
    });
    
    test('Injections with inheritence', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Dependency
        {
            public constructor (
                public a : number
            )
            {}
        }
        
        class Base
        {
            @Inject({ ctorArgs: [ 1 ] })
            public dependency : Dependency;
        }
        
        class Sample
            extends Base
        {
            @Inject({ ctorArgs: [ 2 ] })
            public other : Dependency;
        }
        
        const sample = objectManager.getInstance(Sample);
        
        expect(sample.dependency).toBeInstanceOf(Dependency);
        expect(sample.dependency.a).toBe(1);
        expect(sample.dependency).toBeInstanceOf(Dependency);
        expect(sample.other.a).toBe(2);
    });
    
    test('Injections with overrides', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Dependency
        {
            public constructor (
                public a : number
            )
            {}
        }
        
        class Base
        {
            @Inject({ ctorArgs: [ 1 ] })
            public dependency : Dependency;
        }
        
        class Sample
            extends Base
        {
            @Inject({ ctorArgs: [ 2 ] })
            public dependency : Dependency = null;
        }
        
        const sample = objectManager.getInstance(Sample);
        
        expect(sample.dependency).toBeInstanceOf(Dependency);
        expect(sample.dependency.a).toBe(2);
    });
    
    test('Injections of service & injectables', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Dependency
        {
            public constructor (
                public a : number
            )
            {}
        }
        
        @Injectable({
            tag: 'tag',
            ctorArgs: [ 1 ],
        })
        class Injectable1
            extends Dependency
        {}
        
        @Injectable({
            tag: 'tag',
            ctorArgs: [ 2 ],
        })
        class Injectable2
            extends Dependency
        {}
        
        objectManager.getService('service', Dependency, [ 2 ]);
        
        class Sample
        {
            @Inject({ ctorArgs: [ 1 ] })
            public simple : Dependency;
            
            @Inject({ tag: 'tag' })
            public injectables : { [key: string]: Dependency };
            
            @Inject({ name: 'service' })
            public service : Dependency;
            
            @Inject({ name: 'serviceNew', ctorArgs: [ 3 ] })
            public serviceNew : Dependency;
        }
        
        const sample = objectManager.getInstance(Sample);
        
        expect(sample.simple).toBeInstanceOf(Dependency);
        expect(sample.simple.a).toBe(1);
        
        expect(sample.injectables[0]).toBeInstanceOf(Dependency);
        expect(sample.injectables[0].a).toBe(1);
        
        expect(sample.service).toBeInstanceOf(Dependency);
        expect(sample.service.a).toBe(2);
        
        expect(sample.serviceNew).toBeInstanceOf(Dependency);
        expect(sample.serviceNew.a).toBe(3);
    });
    
    test('Multilevel injection', () => {
        const objectManager = ObjectManager.getSingleton();
        
        class Dependency
        {
            public constructor (
                public a : number
            )
            {}
        }
        
        class DependencySecondLevel
        {
            @Inject({ ctorArgs: [3] })
            public dependency : Dependency;
        
            public constructor (
                public a : number
            )
            {}
        }
        
        class Sample
        {
            @Inject({ ctorArgs: [ 1 ] })
            public dep1 : Dependency;
            
            @Inject({ ctorArgs: [ 2 ] })
            public dep2 : DependencySecondLevel;
        }
        
        const sample = objectManager.getInstance(Sample);
        
        expect(sample.dep1).toBeInstanceOf(Dependency);
        expect(sample.dep1.a).toBe(1);
        
        expect(sample.dep2).toBeInstanceOf(DependencySecondLevel);
        expect(sample.dep2.a).toBe(2);
        expect(sample.dep2.dependency).toBeInstanceOf(Dependency);
        expect(sample.dep2.dependency.a).toBe(3);
    });
    
    
});

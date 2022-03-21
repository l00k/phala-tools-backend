import { getDecoratorTarget } from '../getDecoratorTarget';

describe('getDecoratorTarget', () => {
    
    test('simple distinction', () => {
        class Sample {}
        
        expect(getDecoratorTarget(Sample))
            .toStrictEqual([ Sample, Sample.prototype ]);
        expect(getDecoratorTarget(Sample.prototype))
            .toStrictEqual([ Sample, Sample.prototype ]);
    });
    
    test('distinction using decorators', () => {
        const spy : any = {};
        
        function Decorator(Target : any, prop : string | symbol) {
            spy[prop] = getDecoratorTarget(Target);
        }
        
        class Sample {
            @Decorator
            public static staticVar;
            
            @Decorator
            public simpleVar;
            
            @Decorator
            public static staticMethod() {}
            
            @Decorator
            public simpleMethod() {}
        }
        
        expect(spy.staticVar).toStrictEqual([ Sample, Sample.prototype ]);
        expect(spy.simpleVar).toStrictEqual([ Sample, Sample.prototype ]);
        expect(spy.staticMethod).toStrictEqual([ Sample, Sample.prototype ]);
        expect(spy.simpleMethod).toStrictEqual([ Sample, Sample.prototype ]);
    });
    
});

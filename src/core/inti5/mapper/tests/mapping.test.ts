import { Expose } from 'class-transformer';
import { ParamMapOptions } from '../def';
import { ApplyGetter, ApplyMapping, Getter, Map } from '../index';



describe('Mapping', () => {
    class Sample
    {
        public firstname : string;
        public lastname : string;
        public profession : string;
        public age : number = 18;
        
        public constructor ()
        {
            this.lastname = 'noname';
        }
        
        public get details () : string
        {
            return `${this.firstname} ${this.lastname} ${this.profession} ${this.age}`;
        }
    }
    
    test('No mapping', async() => {
        let spy : any = null;
        
        class Wrapper
        {
            @ApplyMapping()
            public async exec (
                param : Sample
            )
            {
                spy = param;
            }
        }
        
        const wrapper = new Wrapper();
        
        await wrapper.exec(<any>{ firstname: 'tester' });
        
        expect(spy).toStrictEqual({ firstname: 'tester' });
    });
    
    test('Simple type mapping', async() => {
        let spy : any[] = [];
        
        class Wrapper
        {
            @ApplyMapping()
            public async exec (
                noMapParam : Sample,
                @Map()
                    param : Sample
            )
            {
                spy = [ ...arguments ];
            }
        }
        
        const wrapper = new Wrapper();
        
        await wrapper.exec(<any>{ test: 'ok' }, <any>{ firstname: 'tester' });
        
        expect(spy[0])
            .toStrictEqual({ test: 'ok' });
        
        expect(spy[1])
            .toBeInstanceOf(Sample)
            .toMatchObject({ firstname: 'tester' });
        expect(spy[1].shouldBeRemoved)
            .toBeUndefined();
        expect((<Sample>spy[1]).details)
            .toBe('tester noname undefined 18');
    });
    
    test('No mapping if not neccessary', async() => {
        let spy : any = null;
        
        class Wrapper
        {
            @ApplyMapping()
            public async exec (
                @Map()
                    param : Sample
            )
            {
                spy = param;
            }
        }
        
        const wrapper = new Wrapper();
        
        const sample = new Sample();
        sample.firstname = 'tester';
        await wrapper.exec(sample);
        
        expect(spy)
            .toStrictEqual(sample);
        
        await wrapper.exec(null);
        expect(spy).toStrictEqual(null);
    });
    
    test('Explict type definition', async() => {
        let spy : any = null;
        
        class Wrapper
        {
            @ApplyMapping()
            public exec (
                @Map(() => Sample)
                    param1 : any,
                @Map(() => Sample, { config: 'test' })
                    param2 : any
            )
            {
                spy = param1;
            }
        }
        
        const wrapper = new Wrapper();
        
        await wrapper.exec(
            <any>{ firstname: 'tester' },
            <any>{ firstname: 'tester' }
        );
        
        expect(spy)
            .toBeInstanceOf(Sample)
            .toMatchObject({ firstname: 'tester' });
        expect((<Sample>spy).details)
            .toBe('tester noname undefined 18');
    });
    
    test('Custom mapping function', async() => {
        let spy : any = null;
        
        function customMapping (object : any, mapOptions : ParamMapOptions)
        {
            const Type = mapOptions.typeFn();
            
            const out = new Type();
            Object.entries(object)
                .forEach(([ prop, value ]) => {
                    out[prop] = value;
                });
            out.profession = mapOptions.config;
            return out;
        }
        
        class Wrapper
        {
            @ApplyMapping()
            public exec (
                @Map({ customMapping, config: 'tester' })
                    param : Sample
            )
            {
                spy = param;
            }
        }
        
        const wrapper = new Wrapper();
        
        await wrapper.exec(<any>{ firstname: 'tester' });
        
        expect(spy)
            .toBeInstanceOf(Sample)
            .toMatchObject({ firstname: 'tester', profession: 'tester' });
        expect((<Sample>spy).details)
            .toBe('tester noname tester 18');
    });
    
    test('Custom getter function', async() => {
        let spy : any = null;
        
        class Wrapper
        {
            @ApplyGetter()
            @ApplyMapping()
            public exec (
                @Map({ getterFn: (a) => a.param1 })
                    param1 : number,
                @Getter((a) => a.param2)
                    param2 : number
            )
            {
                spy = [ param1, param2 ];
            }
        }
        
        const wrapper = new Wrapper();
        
        await (<any>wrapper).exec({ param1: 1, param2: 2 });
        
        expect(spy)
            .toStrictEqual([ 1, 2 ]);
    });
    
    test('Remove unspecified values', async() => {
        let spy : any = {};
        
        class Sample
        {
            @Expose()
            public exposed : string = 'init';
            public notExposed : string = 'init';
        }
        
        class Wrapper
        {
            @ApplyMapping({ config: { excludeExtraneousValues: true } })
            public exec (
                @Map()
                    withExclude : Sample,
                @Map({ config: { excludeExtraneousValues: false } })
                    withoutExlude : Sample
            )
            {
                spy.withExclude = withExclude;
                spy.withoutExlude = withoutExlude;
            }
        }
        
        const wrapper = new Wrapper();
        
        await wrapper.exec(
            <any>{ exposed: 'ok', notExposed: 'ok', notSpecified: 'ok' },
            <any>{ exposed: 'ok', notExposed: 'ok', notSpecified: 'ok' },
        );
        
        expect(spy.withExclude)
            .toBeInstanceOf(Sample)
            .toMatchObject({ exposed: 'ok', notExposed: 'init' });
        expect(spy.withExclude.notSpecified)
            .toBeUndefined();
        
        expect(spy.withoutExlude)
            .toBeInstanceOf(Sample)
            .toMatchObject({ exposed: 'ok', notExposed: 'ok', notSpecified: 'ok' });
    });
    
    test('Value getter', async() => {
        let spy : any = null;
        
        function getterFn (this : any, param : any)
        {
            return {
                age: this.context.test,
                ...param.nested
            };
        }
        
        class Wrapper
        {
            public context = {
                test: Math.random(),
            };
            
            @ApplyGetter()
            @ApplyMapping()
            public exec (
                @Map({ getterFn })
                    param : Sample
            )
            {
                spy = param;
            }
        }
        
        const wrapper = new Wrapper();
        
        await wrapper.exec(<any>{ nested: { firstname: 'tester' } });
        
        expect(spy)
            .toBeInstanceOf(Sample)
            .toMatchObject({ firstname: 'tester', age: wrapper.context.test });
    });
    
    test('Value async getter', async() => {
        let spy : any = null;
        
        async function getterFn (this : any, param : any)
        {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve({
                        age: this.context.test,
                        ...param.nested
                    });
                }, 1);
            });
        }
        
        class Wrapper
        {
            public context = {
                test: Math.random(),
            };
            
            @ApplyGetter()
            public async exec (
                @Getter(getterFn)
                    param : Object
            )
            {
                spy = param;
            }
        }
        
        const wrapper = new Wrapper();
        
        await wrapper.exec(<any>{ nested: { firstname: 'tester' } });
        
        expect(spy)
            .toMatchObject({ firstname: 'tester', age: wrapper.context.test });
    });
    
});

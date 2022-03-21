import { Validator } from '../Validator';
import * as ObjectAnno from '../Object';
import * as MethodAnno from '../Method';
import { ValidationException } from '../ValidationException';


describe('method validations', () => {
    class Sample
    {
        @ObjectAnno.Assert({}, false)
        public noAssertWithoutTypeCheck : number = <any> '1';
        
        @ObjectAnno.Assert({})
        public noAssertWithTypeCheck : number = 1;
        
        @ObjectAnno.Assert({
            numericality: {
                onlyInteger: true
            }
        })
        public someAssert : number = 1;
    }
    
    
    test('Empty validation', () => {
        const validator = Validator.getSingleton();
        
        class Wrapper
        {
            public execWithoutValidations(
                param1: number
            )
            {}
            
            @MethodAnno.Validate()
            public execOther(
                param1 : number
            )
            {}
        }
        
        const wrapper = new Wrapper();
        
        expect(validator.validateMethod(
            Wrapper,
            'execWithoutValidations',
            [ 1 ]
        )).toEqual({
            valid: true,
            errors: {}
        });
    });
    
    test('Empty validation (just no rules)', () => {
        const validator = Validator.getSingleton();
        
        class Wrapper
        {
            public execWithoutValidations(
                param1: number
            ) : boolean
            {
                return true;
            }
            
            public execOther(
                @MethodAnno.Assert()
                param1 : number
            )
            {
            }
        }
        
        const wrapper = new Wrapper();
        
        expect(validator.validateMethod(
            Wrapper,
            'execWithoutValidations',
            [ 1 ]
        )).toEqual({
            valid: true,
            errors: {}
        });
    });
    
    test('Return type validation', () => {
        class Wrapper
        {
        
            @MethodAnno.Validate()
            public withoutReturnValidation() : number
            {
                return <any> true;
            }
        
            @MethodAnno.Validate(true)
            public withReturnValidation() : number
            {
                return <any> true;
            }
        
        }
        
        const wrapper = new Wrapper();
        
        expect(wrapper.withoutReturnValidation()).toBe(true);
        expect(() => wrapper.withReturnValidation()).toThrow();
    });
    
    test('Prevent execution on validation failed', () => {
        let spyValue = [];
    
        class Wrapper
        {
        
            @MethodAnno.Validate()
            public execTypesOnly(
                @MethodAnno.Assert()
                param1 : number
            ) : number
            {
                spyValue.push(`execTypesOnly-${param1}`);
                return <any> true;
            }
        
            @MethodAnno.Validate()
            public execWithAssertion(
                @MethodAnno.Assert({ numericality: { onlyInteger: true } })
                param1 : number
            ) : number
            {
                spyValue.push(`execWithAssertion-${param1}`);
                return <any> true;
            }
        
        }
        
        const wrapper = new Wrapper();
        
        expect(wrapper.execTypesOnly(1)).toBe(true);
        expect(spyValue.includes('execTypesOnly-1')).toStrictEqual(true);
        
        expect(() => wrapper.execTypesOnly(<any> 'test')).toThrowError(ValidationException);
        expect(spyValue.includes('execTypesOnly-test')).toStrictEqual(false);
        
        expect(wrapper.execWithAssertion(1)).toBe(true);
        expect(spyValue.includes('execWithAssertion-1')).toStrictEqual(true);
        
        expect(() => wrapper.execWithAssertion(1.25)).toThrowError(ValidationException);
        expect(spyValue.includes('execWithAssertion-test')).toStrictEqual(false);
    });
    
    test('Parameter assertions validation', () => {
        const validator = Validator.getSingleton();
        
        class Wrapper
        {
        
            @MethodAnno.Validate()
            public exec(
                @MethodAnno.Assert({
                    presence: true,
                    numericality: { onlyInteger: true }
                })
                param1 : number,
                param2 : any,
                @MethodAnno.Assert({ email: true }, false)
                param3 : string,
            ) : boolean
            {
                return true;
            }
        
        }
        
        expect(validator.validateMethod(
            Wrapper,
            'exec',
            [1, 'bla', 'sample@example.com']
        )).toEqual({
            valid: true,
            errors: {}
        });
        
        expect(validator.validateMethod(
            Wrapper,
            'exec',
            ['1']
        )).toEqual({
            valid: false,
            errors: {
                0: [ { rule: 'type' } ]
            }
        });
        
        expect(validator.validateMethod(
            Wrapper,
            'exec',
            [1, 'bla', 'example.com']
        )).toEqual({
            valid: false,
            errors: {
                2: [ { rule: 'email', options: true } ]
            }
        });
        
        expect(validator.validateMethod(
            Wrapper,
            'exec',
            []
        )).toEqual({
            valid: false,
            errors: {
                0: [ { rule: 'presence', options: true } ]
            }
        });
    });
    
    
    test('Array of simple - validation', () => {
        const validator = Validator.getSingleton();
        
        class Wrapper
        {
        
            @MethodAnno.Validate()
            public exec(
                @MethodAnno.Assert({
                    presence: true,
                    numericality: { onlyInteger: true }
                }, () => [Number])
                param1 : number[]
            ) : boolean
            {
                return true;
            }
        
        }
        
        expect(validator.validateMethod(
            Wrapper,
            'exec',
            [ [1, 2] ]
        )).toEqual({
            valid: true,
            errors: {}
        });
        
        expect(validator.validateMethod(
            Wrapper,
            'exec',
            [ 2 ]
        )).toEqual({
            valid: false,
            errors: {
                '0': [ { rule: 'type' } ]
            }
        });
        
    });
    
    test('Array of typed - validation', () => {
        const validator = Validator.getSingleton();
        
        class Wrapper
        {
        
            @MethodAnno.Validate()
            public exec(
                @MethodAnno.Assert({ presence: true }, () => [Sample])
                param1 : Sample[]
            ) : boolean
            {
                return true;
            }
        
        }
        
        expect(validator.validateMethod(
            Wrapper,
            'exec',
            [ [ new Sample() ] ]
        )).toEqual({
            valid: true,
            errors: {}
        });
        
        expect(validator.validateMethod(
            Wrapper,
            'exec',
            [ [ { test: 1 } ] ]
        )).toEqual({
            valid: false,
            errors: {
                '0.0': [ { rule: 'type' } ],
                '0.0.test': [ { rule: 'unspecifiedProperty' } ],
            }
        });
        
    });
    
    test('Complex type validation', () => {
        const validator = Validator.getSingleton();
        
        class Wrapper
        {
        
            @MethodAnno.Validate()
            public exec(
                @MethodAnno.Assert({
                    name: { type: 'string', presence: true },
                    value: { numericality: true },
                }, { isComplex: true })
                obj : any
            ) : boolean
            {
                return true;
            }
        
            @MethodAnno.Validate()
            public execOther(
                @MethodAnno.Assert({
                    name: { type: 'string', presence: true },
                    value: { numericality: true },
                }, { isArray: true, isComplex: true })
                obj : any[]
            ) : boolean
            {
                return true;
            }
        
        }
        
        expect(validator.validateMethod(
            Wrapper,
            'exec',
            [ { name: 'sample', value: 25 } ]
        )).toEqual({
            valid: true,
            errors: {}
        });
        
        expect(validator.validateMethod(
            Wrapper,
            'exec',
            [ { value: 25 } ]
        )).toEqual({
            valid: false,
            errors: {
                '0.name': [ { rule: 'presence', options: true } ]
            }
        });
        
        expect(validator.validateMethod(
            Wrapper,
            'execOther',
            [ [ { name: 'sample', value: 25 }, { name: 'sample', value: false } ] ]
        )).toEqual({
            valid: false,
            errors: {
                '0.1.value': [ { rule: 'numericality', options: true } ]
            }
        });
        
    });
    
});

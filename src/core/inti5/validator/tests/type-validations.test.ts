import { Validator } from '../Validator';


describe('type validations', () => {
    afterEach(() => {
        delete globalThis[(<any>Validator).STORAGE_KEY];
    });
    
    test('Validate type', () => {
        const validator = Validator.getSingleton();
        
        class Sample1 {}
        class Sample2 {}
        
        expect(() => validator.validateType(true, null))
            .toThrow();
        
        expect(validator.validateType(undefined, Boolean)).toBe(true);
        expect(validator.validateType(null, Boolean)).toBe(true);
        
        expect(validator.validateType(true, Boolean)).toBe(true);
        expect(validator.validateType(false, Boolean)).toBe(true);
        expect(validator.validateType(Boolean(false), Boolean)).toBe(true);
        expect(validator.validateType(1, Boolean)).toBe(false);
        expect(validator.validateType('abc', Boolean)).toBe(false);
        expect(validator.validateType(new Date(), Boolean)).toBe(false);
        
        expect(validator.validateType(0, Number)).toBe(true);
        expect(validator.validateType(1.24, Number)).toBe(true);
        expect(validator.validateType(Number(1.24), Number)).toBe(true);
        expect(validator.validateType(true, Number)).toBe(false);
        expect(validator.validateType('abc', Number)).toBe(false);
        expect(validator.validateType(new Date(), Number)).toBe(false);
        
        expect(validator.validateType(BigInt(34), BigInt)).toBe(true);
        expect(validator.validateType(0, BigInt)).toBe(false);
        expect(validator.validateType(true, BigInt)).toBe(false);
        expect(validator.validateType('abc', BigInt)).toBe(false);
        expect(validator.validateType(new Date(), BigInt)).toBe(false);
        
        expect(validator.validateType('', String)).toBe(true);
        expect(validator.validateType('abcde', String)).toBe(true);
        expect(validator.validateType(String('abcde'), String)).toBe(true);
        expect(validator.validateType(false, String)).toBe(false);
        expect(validator.validateType(2, String)).toBe(false);
        expect(validator.validateType(new Date(), String)).toBe(false);
        
        expect(validator.validateType(new Sample1(), Sample1)).toBe(true);
        expect(validator.validateType(new Sample1(), Sample2)).toBe(false);
        expect(validator.validateType(false, Sample1)).toBe(false);
        expect(validator.validateType(2, Sample1)).toBe(false);
    });
    
});

import validateJsExt from '../validateJsExt';

describe('Custom validators', () => {
    
    test('Validation rule - numeric', () => {
        expect(validateJsExt.validators.type.types.numeric('1.235')).toBe(true);
        expect(validateJsExt.validators.type.types.numeric(1)).toBe(true);
        expect(validateJsExt.validators.type.types.numeric(Number(1))).toBe(true);
        
        expect(validateJsExt.validators.type.types.numeric('a1.235')).toBe(false);
        expect(validateJsExt.validators.type.types.numeric(false)).toBe(false);
    });
    
});

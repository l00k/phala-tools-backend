import { isArrowFunction, isFunction, isPlainObject } from '../common';

describe('common', () => {
    
    test('isPlainObject positive', () => {
        expect(isPlainObject({})).toBe(true);
        expect(isPlainObject({ a: true })).toBe(true);
    });
    
    class Foo
    {
    }
    
    test('isPlainObject negative', () => {
        expect(isPlainObject(5)).toBe(false);
        expect(isPlainObject(Number(5))).toBe(false);
        expect(isPlainObject(new Date())).toBe(false);
        expect(isPlainObject(new Foo())).toBe(false);
    });
    
    test('isFunction positive', () => {
        expect(isFunction(function() {})).toBe(true);
        expect(isFunction(() => 1)).toBe(true);
        expect(isFunction(async() => 1)).toBe(true);
        expect(isFunction(Date.now)).toBe(true);
        expect(isFunction(String)).toBe(true);
    });
    
    test('isFunction negative', () => {
        expect(isFunction(5)).toBe(false);
        expect(isFunction(true)).toBe(false);
    });
    
    test('isArrowFunction positive', () => {
        expect(isArrowFunction(() => 1)).toBe(true);
        expect(isArrowFunction(() => {})).toBe(true);
        expect(isArrowFunction(async() => 1)).toBe(true);
    });
    
    test('isArrowFunction negative', () => {
        expect(isArrowFunction(5)).toBe(false);
        expect(isArrowFunction(true)).toBe(false);
        expect(isArrowFunction(function() {})).toBe(false);
        expect(isArrowFunction(Date.now)).toBe(false);
        expect(isArrowFunction(String)).toBe(false);
    });
    
});

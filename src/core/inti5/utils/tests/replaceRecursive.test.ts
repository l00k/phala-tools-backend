import { replaceRecursive } from '../replaceRecursive';

describe('replaceRecursive', () => {
    
    test('Proper array merge', () => {
        const object = { a: [ 1, 2 ], b: 2 };
        const other = { a: [ 3 ], b: 4 };
        
        replaceRecursive(object, other);
        
        expect(object)
            .toEqual({
                a: [ 3 ],
                b: 4,
            });
    });
    
});

import { mergeRecursive } from '../mergeRecursive';

describe('mergeRecursive', () => {
    
    test('Proper array merge', () => {
        const object = { a: [ 1, 2 ], b: 2 };
        const other = { a: [ 3 ], b: 4 };
        
        mergeRecursive(object, other);
        
        expect(object)
            .toEqual({
                a: [ 1, 2, 3 ],
                b: 4,
            });
    });
    
});

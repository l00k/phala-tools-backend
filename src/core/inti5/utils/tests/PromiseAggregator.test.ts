import { PromiseAggregator } from '../PromiseAggregator';

describe('PromiseAggregator', () => {
    
    test('successful aggregation all', async() => {
        expect.assertions(1);
        await expect(PromiseAggregator.all([ 1, 2, 3 ], async(e) => e))
            .resolves.toStrictEqual([ 1, 2, 3 ]);
    });
    
    test('fails if any fail in aggregation all', async() => {
        expect.assertions(1);
        
        await expect(PromiseAggregator.all([ 1, 2, 3 ], async(e) => {
            if (e <= 2) {
                return e;
            }
            else {
                throw e;
            }
        }))
            .rejects.toBe(3);
    });
    
    test('successful aggregation allSettled', async() => {
        expect.assertions(1);
        
        await expect(PromiseAggregator.allSettled([ 1, 2, 3 ], async(e) => {
            if (e <= 2) {
                return e;
            }
            else {
                throw e;
            }
        }))
            .resolves.toBeDefined();
    });
    
});

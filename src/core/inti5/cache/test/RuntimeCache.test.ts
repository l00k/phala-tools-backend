describe('RuntimeCache', () => {
    let dateNowSpy;
    let currentNow;
    
    beforeAll(() => {
        dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentNow);
    });
    
    afterAll(() => {
        dateNowSpy.mockRestore();
    });
    
    
    test('get() works', async() => {
        const { RuntimeCache } = require('../RuntimeCache');
        
        let retValue = 'inital';
        const callback = jest.fn(() => retValue);
        
        currentNow = 1639135385953;
        
        const cache = new RuntimeCache();
        
        {
            const value = await cache.get('sample', callback, { lifetime: 10 });
            expect(value).toBe('inital');
            expect(callback).toHaveBeenCalledTimes(1);
        }
        
        retValue = 'changed';
        currentNow += 5000;
        
        {
            const value = await cache.get('sample', callback, { lifetime: 10 });
            expect(value).toBe('inital');
            expect(callback).toHaveBeenCalledTimes(1);
        }
        
        currentNow += 6000;
        
        {
            const value = await cache.get('sample', callback, { lifetime: 10 });
            expect(value).toBe('changed');
            expect(callback).toHaveBeenCalledTimes(2);
        }
    });
    
    
    test('get(permenent) works', async() => {
        const { RuntimeCache } = require('../RuntimeCache');
        
        let retValue = 'inital';
        const callback = jest.fn(() => retValue);
        
        currentNow = 1639135385953;
        
        const cache = new RuntimeCache();
        
        {
            const value = await cache.get('sample', callback, { lifetime: 0 });
            expect(value).toBe('inital');
            expect(callback).toHaveBeenCalledTimes(1);
        }
        
        retValue = 'changed';
        currentNow += 10000000000;
        
        {
            const value = await cache.get('sample', callback, { lifetime: 0 });
            expect(value).toBe('inital');
            expect(callback).toHaveBeenCalledTimes(1);
        }
    });
    
    
    test('getSync() works', () => {
        const { RuntimeCache } = require('../RuntimeCache');
        
        let retValue = 'inital';
        const callback = jest.fn(() => retValue);
        
        currentNow = 1639135385953;
        
        const cache = new RuntimeCache();
        
        {
            const value = cache.getSync('sample', callback, { lifetime: 10 });
            expect(value).toBe('inital');
            expect(callback).toHaveBeenCalledTimes(1);
        }
        
        retValue = 'changed';
        currentNow += 5000;
        
        {
            const value = cache.getSync('sample', callback, { lifetime: 10 });
            expect(value).toBe('inital');
            expect(callback).toHaveBeenCalledTimes(1);
        }
        
        currentNow += 6000;
        
        {
            const value = cache.getSync('sample', callback, { lifetime: 10 });
            expect(value).toBe('changed');
            expect(callback).toHaveBeenCalledTimes(2);
        }
    });
    
    
    test('getSync(permanent) works', () => {
        const { RuntimeCache } = require('../RuntimeCache');
        
        let retValue = 'inital';
        const callback = jest.fn(() => retValue);
        
        currentNow = 1639135385953;
        
        const cache = new RuntimeCache();
        
        {
            const value = cache.getSync('sample', callback, { lifetime: 0 });
            expect(value).toBe('inital');
            expect(callback).toHaveBeenCalledTimes(1);
        }
        
        retValue = 'changed';
        currentNow += 10000000000;
        
        {
            const value = cache.getSync('sample', callback, { lifetime: 0 });
            expect(value).toBe('inital');
            expect(callback).toHaveBeenCalledTimes(1);
        }
    });
    
    
    test('clear works', () => {
        const { RuntimeCache } = require('../RuntimeCache');
        
        let retValue = 'inital';
        const callback = jest.fn(() => retValue);
        
        currentNow = 1639135385953;
        
        const cache = new RuntimeCache();
        
        {
            const value = cache.getSync('sample', callback, { lifetime: 10 });
            expect(value).toBe('inital');
            expect(callback).toHaveBeenCalledTimes(1);
        }
        
        retValue = 'changed';
        currentNow += 5000;
        
        cache.clear();
        
        {
            const value = cache.getSync('sample', callback, { lifetime: 10 });
            expect(value).toBe('changed');
            expect(callback).toHaveBeenCalledTimes(2);
        }
    });
    
    
    test('pullMultiple() works', () => {
        const { RuntimeCache } = require('../RuntimeCache');
        const cache = new RuntimeCache();
        
        cache.getSync('var1', () => 1, { lifetime: 10 });
        
        expect(() => cache.pullMultiple([ 'var1', 'var2' ]))
            .toThrow();
        
        cache.getSync('var2', () => 2, { lifetime: 10 });
        
        expect(cache.pullMultiple([ 'var1', 'var2' ]))
            .toStrictEqual([ 1, 2 ]);
    });
    
    
    test('pullAll() works', () => {
        const { RuntimeCache } = require('../RuntimeCache');
        const cache = new RuntimeCache();
        
        cache.getSync('var1', () => 1, { lifetime: 10 });
        cache.getSync('var2', () => 2, { lifetime: 10 });
        
        expect(cache.pullAll())
            .toStrictEqual([ 1, 2 ]);
    });

});

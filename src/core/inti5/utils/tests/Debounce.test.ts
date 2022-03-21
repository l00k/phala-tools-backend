describe('Debounce', () => {
    
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    
    let dateNowSpy;
    let currentNow;
    
    
    beforeAll(() => {
        dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentNow);
    });
    
    afterAll(() => {
        dateNowSpy.mockRestore();
    });
    
    
    test('debounced', async() => {
        const { Debounce } = require('../Debounce');
        const callback = jest.fn();
        
        currentNow = 1639135385953;
        
        class Foo
        {
            
            @Debounce(1000)
            public run (callback : () => any)
            {
                return callback();
            }
            
        }
        
        const foo = new Foo();
        foo.run(callback);
        jest.advanceTimersByTime(600);
        foo.run(callback);
        jest.advanceTimersByTime(600);
        foo.run(callback);
        
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
        
        expect(callback).not.toBeCalled();
        
        currentNow += 500;
        jest.advanceTimersByTime(500);
        
        expect(callback).not.toBeCalled();
        
        currentNow += 600;
        jest.advanceTimersByTime(600);
        
        expect(callback).toBeCalled();
        expect(callback).toHaveBeenCalledTimes(1);
    });

});

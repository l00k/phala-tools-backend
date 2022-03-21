import { autoRetry } from '../autoRetry';


describe('autoRetry', () => {

    class FlawedService
    {
        
        public counter : number = 0;
        
        public constructor (
            public triesUntilSuccessful : number
        )
        {}
        
        public async run () : Promise<true>
        {
            if (this.counter++ < this.triesUntilSuccessful) {
                throw 'Failed';
            }
            return true;
        }
        
    }
    
    
    test('successful retry', async() => {
        expect.assertions(1);
        
        const service = new FlawedService(3);
        await expect(autoRetry(() => service.run(), { tries: 4 }))
            .resolves.toBe(true);
    });
    
    test('fails to retry', async() => {
        expect.assertions(1);
        
        const service = new FlawedService(3);
        await expect(autoRetry(() => service.run(), { tries: 3 }))
            .rejects.toThrow();
    });
    
});

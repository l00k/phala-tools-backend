import { getPrototypesFromChain } from '../getPrototypesFromChain';

describe('getPrototypesFromChain', () => {
    
    test('simple', () => {
        class Base {}
        class Child extends Base {}
        class GrandChild extends Child {}
        
        expect(getPrototypesFromChain(GrandChild.prototype))
            .toStrictEqual([ GrandChild.prototype, Child.prototype, Base.prototype ]);
    });
    
});

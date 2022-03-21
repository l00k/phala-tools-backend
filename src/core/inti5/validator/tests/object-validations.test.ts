import { Validator } from '../Validator';
import { Assert, AssertOptions } from '../Object';
import * as MethodAnno from '../Method';


describe('object validations', () => {
    class NoAssertsSample
    {
    }

    class Sample
    {
        @Assert({}, false)
        public noAssertWithoutTypeCheck : number = <any> '1';
        
        @Assert({})
        public noAssertWithTypeCheck : number = 1;
        
        @Assert({
            numericality: {
                onlyInteger: true
            }
        })
        public someAssert : number = 1;
        
        @Assert({}, () => [ Number ])
        public arrayParam : number[] = [1];
    }
    
    @AssertOptions({
        allowUnspecifiedProperties: true
    })
    class SampleAllowedProps
        extends Sample
    {
    }
    
    class SampleWithPresence
        extends Sample
    {
        @Assert({
            presence: true
        })
        public presenceRequired : number;
    }
    
    class SampleOverriden
        extends Sample
    {
        @Assert({
            numericality: {
                greaterThanOrEqualTo: 4
            }
        })
        public someAssert : number = 4;
    }
    
    class Child
    {
        @Assert({
            numericality: {
                greaterThanOrEqualTo: 1
            }
        })
        public someAssert : number = 1;
    }
    
    class Child2
    {
        @Assert({
            numericality: {
                greaterThanOrEqualTo: 1
            }
        })
        public someAssert : number = 1;
    }
    
    class SampleWithChildren
        extends Sample
    {
        @Assert()
        public child : Child = null;
        
        @Assert({}, () => [Child2])
        public collection : Child2[] = [];
    }
    
    
    test('Empty validation', () => {
        const validator = Validator.getSingleton();
        
        const sample = new NoAssertsSample();
        
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {}
            });
    });
    
    test('Validate simple (typed object)', () => {
        const validator = Validator.getSingleton();
        
        let sample : any;
        
        sample = new Sample();
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {}
            });
            
        sample = new Sample();
        sample.noAssertWithTypeCheck = '1';
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    noAssertWithTypeCheck: [ { rule: 'type' } ],
                },
            });
            
        sample = new Sample();
        sample.someAssert = 1.25;
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    someAssert: [ { rule: 'numericality' } ]
                },
            });
            
        sample = new Sample();
        sample.arrayParam = undefined;
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {}
            });
    });
    
    test('Validate simple (plain object)', () => {
        const validator = Validator.getSingleton();
        
        const sample : any = {
            noAssertWithoutTypeCheck: '1',
            noAssertWithTypeCheck: 1,
        };
        
        expect(validator.validateObject(sample, Sample))
            .toEqual({
                valid: true,
                errors: {}
            });
    });
    
    test('Validate non allowed unspecified properties (typed object)', () => {
        const validator = Validator.getSingleton();
        
        const sample : any = new Sample();
        sample.unspecifiedProperty = 1;
        
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    unspecifiedProperty: [ { rule: 'unspecifiedProperty' } ]
                }
            });
    });
    
    test('Validate non allowed unspecified properties (plain object)', () => {
        const validator = Validator.getSingleton();
        
        const sample : any = {
            unspecifiedProperty: 1,
        };
        
        expect(validator.validateObject(sample, Sample))
            .toMatchObject({
                valid: false,
                errors: {
                    unspecifiedProperty: [ { rule: 'unspecifiedProperty' } ]
                }
            });
    });
    
    test('Validate allowed unspecified properties (typed object)', () => {
        const validator = Validator.getSingleton();
        
        const sample : any = new SampleAllowedProps();
        sample.unspecifiedProperty = 1;
        
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {}
            });
    });
    
    test('Properties presence', () => {
        const validator = Validator.getSingleton();
        
        const sample : any = new SampleWithPresence();
        
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    presenceRequired: [ { rule: 'presence' } ]
                },
            });
            
        sample.presenceRequired = 1;
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {},
            });
    });
    
    test('Overriden properties', () => {
        const validator = Validator.getSingleton();
        
        const sample : any = new SampleOverriden();
        
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {},
            });
            
        sample.someAssert = 1;
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    someAssert: [ { rule: 'numericality' } ]
                },
            });
            
        sample.someAssert = 4.25;
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    someAssert: [ { rule: 'numericality' } ]
                },
            });
    });
    
    test('With children (array)', () => {
        const validator = Validator.getSingleton();
        
        const sample : any = new SampleWithChildren();
        
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {},
            });
        
        sample.collection = new Child2();
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    'collection': [ { rule: 'type' } ]
                },
            });
    });
    
    test('With children (types)', () => {
        const validator = Validator.getSingleton();
        
        const sample : any = new SampleWithChildren();
        
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {},
            });
        
        sample.child = new Child2();
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    child: [ { rule: 'type' } ]
                },
            });
        
        sample.child = new Child();
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {},
            });
        
        sample.collection = [ new Child2() ];
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {},
            });
        
        sample.collection.push(new Child());
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    'collection.1': [ { rule: 'type' } ]
                },
            });
    });
    
    test('With children (asserts)', () => {
        const validator = Validator.getSingleton();
        
        const sample : any = new SampleWithChildren();
        sample.child = new Child();
        sample.collection = [ new Child2(), new Child2() ];
        
        expect(validator.validateObject(sample))
            .toEqual({
                valid: true,
                errors: {},
            });
            
        sample.child.someAssert = 0;
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    'child.someAssert': [ { rule: 'numericality' } ]
                },
            });
            
        sample.collection[1].someAssert = 0;
        expect(validator.validateObject(sample))
            .toMatchObject({
                valid: false,
                errors: {
                    'child.someAssert': [ { rule: 'numericality' } ],
                    'collection.1.someAssert': [ { rule: 'numericality' } ],
                },
            });
    });
    
    
});

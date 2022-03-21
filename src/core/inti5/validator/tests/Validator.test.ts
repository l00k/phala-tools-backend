import { Validator } from '../Validator';
import * as ObjectAnno from '../Object';
import * as MethodAnno from '../Method';


describe('Validator', () => {
    afterEach(() => {
        delete globalThis[(<any>Validator).STORAGE_KEY];
    });
    
    test('Singleton', () => {
        const first = Validator.getSingleton();
        expect(Validator.getSingleton())
            .toStrictEqual(first);
    });
    
    test('Register object options', () => {
        const validator = Validator.getSingleton();
        
        @ObjectAnno.AssertOptions({
            allowUnspecifiedProperties: true
        })
        class Sample
        {
        }
        
        expect((<any>validator).descriptions.get(Sample))
            .toStrictEqual({
                allowUnspecifiedProperties: true,
                properties: {},
                methods: {},
            });
    });
    
    test('Register object assertion', () => {
        const validator = Validator.getSingleton();
        
        class Sample
        {
            @ObjectAnno.Assert({
                type: 'number'
            })
            public a : number;
            
            @ObjectAnno.Assert({}, false)
            public b : number;
            
            @ObjectAnno.Assert({}, { isComplex: true })
            public c : any;
            
            @ObjectAnno.Assert({}, () => [ Number ], { isArray: true })
            public d : number[];
        }
        
        expect(JSON.stringify((<any>validator).descriptions.get(Sample)))
            .toStrictEqual(JSON.stringify({
                allowUnspecifiedProperties: false,
                properties: {
                    a: {
                        rules: { type: 'number' },
                        typeFn: () => Number,
                        options: {
                            isArray: false,
                            isComplex: false,
                            validateType: true,
                        }
                    },
                    b: {
                        rules: {},
                        typeFn: undefined,
                        options: {
                            isArray: false,
                            isComplex: false,
                        }
                    },
                    c: {
                        rules: {},
                        typeFn: undefined,
                        options: {
                            isArray: false,
                            isComplex: true,
                        }
                    },
                    d: {
                        rules: {},
                        typeFn: () => [ Number ],
                        options: {
                            isArray: true,
                            isComplex: false,
                            validateType: true,
                        }
                    }
                },
                methods: {},
            }));
    });
    
    test('Register function assertion', () => {
        const validator = Validator.getSingleton();
        
        class Sample
        {
            
            @MethodAnno.Validate()
            public a(
                @MethodAnno.Assert({}, undefined, { isComplex: true })
                param1 : number,
                param2 : number,
                @MethodAnno.Assert({ type: 'number' })
                param3 : number,
                @MethodAnno.Assert({}, { isComplex: true })
                param4 : any
            )
            {
            }
            
        }
        
        expect(JSON.stringify((<any>validator).descriptions.get(Sample)))
            .toStrictEqual(JSON.stringify({
                allowUnspecifiedProperties: false,
                properties: {},
                methods: {
                    a: {
                        0: {
                            rules: {},
                            typeFn: () => Number,
                            options: {
                                isArray: false,
                                isComplex: true,
                                validateType: true,
                            }
                        },
                        2: {
                            rules: { type: 'number' },
                            typeFn: () => Number,
                            options: {
                                isArray: false,
                                isComplex: false,
                                validateType: true,
                            }
                        },
                        3: {
                            rules: {},
                            typeFn: undefined,
                            options: {
                                isArray: false,
                                isComplex: true,
                                validateType: false,
                            }
                        }
                    }
                },
            }));
    });
});

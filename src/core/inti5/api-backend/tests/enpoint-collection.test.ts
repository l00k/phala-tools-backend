import { ObjectManager } from '@inti5/object-manager';
import * as Api from '../index';
import { Annotation as API } from '../index';


describe('Collection endpoints', () => {
    let spy = jest.fn();
    
    @API.Resource()
    class Book
    {
        
        @API.Id()
        public id : number;
        
        @API.Property()
        @API.Filterable()
        @API.Sortable([ 'ASC' ])
        public name : string = 'Unnamed';
        
    }
    
    @API.Resource()
    class Author
    {
        
        @API.Id()
        public id : number;
        
        @API.Property()
        @API.Filterable()
        @API.Sortable()
        public name : string = 'John Doe';
        
        @API.Property()
        @API.Filterable()
        @API.Sortable()
        public balance : number = 1000;
        
        @API.Property(() => Number)
        @API.Filterable([ '$in' ])
        public groups : number[] = [ 1, 2 ];
        
        @API.Property(() => Boolean)
        @API.Filterable()
        public active : boolean;
        
        @API.Property()
        @API.Filterable()
        public createdAt : Date;
        
        @API.Property()
        @API.Filterable([ '$gte', '$lte' ])
        public updatedAt : Date;
        
        @API.Property()
        @API.Filterable()
        public complexData : Object;
        
        @API.Property()
        public simple = true;
        
        @API.Property(() => Book)
        @API.Filterable()
        @API.Sortable()
        public books : Book[] = [];
        
        @API.Property(() => Book)
        @API.Filterable()
        @API.Sortable()
        public mostKnownBook : Book = null;
        
        public excluded : number = 18;
        
    }
    
    class AuthorController
    {
        
        @API.Endpoint('author')
        public async getCollection (
            @API.CollectionRequest(() => Author, [ 50, 100, 200 ], 50)
                request : Api.Domain.CollectionRequest<Author>
        ) : Promise<boolean>
        {
            spy(request.filters, request.sorting, request.pagination, request.populate);
            return true;
        }
        
        @API.Endpoint('different')
        public async getOtherCollection (
            @API.CollectionRequest(() => Author)
                request : Api.Domain.CollectionRequest<Author>
        ) : Promise<boolean>
        {
            spy(request.filters, request.sorting, request.pagination, request.populate);
            return true;
        }
        
        @API.Endpoint('withContext')
        public async withContext (
            @API.RequestContext()
                context
        ) : Promise<boolean>
        {
            spy(context);
            return true;
        }
    }
    
    beforeEach(() => {
        spy = jest.fn();
    });
    
    test('Body validation errors', async() => {
        expect.assertions(1);
        
        const objectManager = ObjectManager.getSingleton();
        
        const api = objectManager.getInstance(Api.Service);
        api.bootstrap();
        
        const controller : any = objectManager.getInstance(AuthorController);
        
        {
            const body = {
                filters: {
                    test: { $like: '%test%' },
                    name: { $like: 5, $qw: '%test%' },
                    groups: { $eq: 2, $in: [ 5 ] },
                    simple: { $eq: false },
                    books: {
                        test: { $eq: 1 },
                        $eq: 1,
                    },
                    mostKnownBook: {
                        test: { $eq: 1 },
                        $eq: 1,
                    },
                },
                sorting: {
                    test: 'ASCa',
                    name: 'DESCa',
                    groups: 'ASC',
                    simple: 'ASC',
                    books: {
                        test: 'ASC',
                        name: 'DESC'
                    },
                    mostKnownBook: {
                        test: 'ASC'
                    },
                },
                pagination: {
                    page: 0,
                    itemsPerPage: 26
                },
                populate: [ 'test' ],
            };
            
            await expect(controller.getCollection({ body }, {}))
                .rejects
                .toMatchObject({
                    details: {
                        errors: {
                            '0.filters.test': [ { rule: 'unspecifiedProperty' } ],
                            '0.filters.name.$like': [ { rule: 'type' } ],
                            '0.filters.groups.$eq': [ { rule: 'unspecifiedProperty' } ],
                            '0.filters.simple': [ { rule: 'unspecifiedProperty' } ],
                            '0.filters.books.test': [ { rule: 'unspecifiedProperty' } ],
                            '0.filters.books.$eq': [ { rule: 'unspecifiedProperty' } ],
                            '0.filters.mostKnownBook.test': [ { rule: 'unspecifiedProperty' } ],
                            '0.filters.mostKnownBook.$eq': [ { rule: 'unspecifiedProperty' } ],
                            '0.sorting.test': [ { rule: 'unspecifiedProperty' } ],
                            '0.sorting.name': [ { rule: 'inclusion' } ],
                            '0.sorting.groups': [ { rule: 'unspecifiedProperty' } ],
                            '0.sorting.simple': [ { rule: 'unspecifiedProperty' } ],
                            '0.sorting.books.test': [ { rule: 'unspecifiedProperty' } ],
                            '0.sorting.books.name': [ { rule: 'inclusion' } ],
                            '0.sorting.mostKnownBook.test': [ { rule: 'unspecifiedProperty' } ],
                            '0.pagination.page': [ { rule: 'numericality' } ],
                            '0.pagination.itemsPerPage': [ { rule: 'inclusion' } ],
                            '0.populate': [ { rule: 'unspecifiedProperty' } ],
                        }
                    }
                });
        }
    });
    
    test('Check proper values passed to action', async() => {
        expect.assertions(6);
        
        const objectManager = ObjectManager.getSingleton();
        
        const api = objectManager.getInstance(Api.Service);
        api.bootstrap();
        
        const controller : any = objectManager.getInstance(AuthorController);
        
        {
            const body = {
                filters: {
                    name: { $like: '%test%' },
                    groups: { $in: [ 5 ] },
                    books: {
                        name: { $eq: 'test' },
                    },
                    mostKnownBook: {
                        name: { $eq: 'test' },
                    },
                },
                sorting: {
                    balance: 'ASC',
                    name: 'DESC',
                    books: {
                        name: 'ASC'
                    },
                    mostKnownBook: {
                        name: 'ASC'
                    },
                },
                pagination: {
                    page: 1,
                    itemsPerPage: 50
                }
            };
            
            const result = await controller.getCollection({ body }, {});
            expect(result).toStrictEqual(true);
            
            expect(spy)
                .toBeCalledTimes(1)
                .toHaveBeenLastCalledWith(
                    { name: { $like: '%test%' }, groups: { $in: [ 5 ] }, books: { name: { $eq: 'test' } }, mostKnownBook: { name: { $eq: 'test' } } },
                    { balance: 'ASC', name: 'DESC', books: { name: 'ASC' }, mostKnownBook: { name: 'ASC' }, },
                    { page: 1, itemsPerPage: 50 },
                    []
                );
        }
        
        {
            const body = {};
            const result = await controller.getCollection({ body }, {});
            expect(result).toStrictEqual(true);
            
            expect(spy)
                .toBeCalledTimes(2)
                .toHaveBeenLastCalledWith(
                    {},
                    {},
                    { page: 1, itemsPerPage: 50 },
                    []
                );
        }
    });
    
    test('Complex filters ($and, $or, $not)', async() => {
        expect.assertions(3);
        
        const objectManager = ObjectManager.getSingleton();
        
        const api = objectManager.getInstance(Api.Service);
        api.bootstrap();
        
        const controller : any = objectManager.getInstance(AuthorController);
        
        {
            const body = {
                filters: {
                    $and: [
                        {
                            $or: [
                                { name: { $like: 'ok' } },
                                { name: { $like: 'yeap' } }
                            ],
                        },
                        { balance: { $eq: 1000 } },
                    ]
                }
            };
            
            const result = await controller.getCollection({ body }, {});
            expect(result).toStrictEqual(true);
            
            expect(spy)
                .toBeCalledTimes(1)
                .toHaveBeenLastCalledWith(
                    {
                        $and: [
                            {
                                $or: [
                                    { name: { $like: 'ok' } },
                                    { name: { $like: 'yeap' } }
                                ],
                            },
                            { balance: { $eq: 1000 } },
                        ]
                    },
                    {},
                    { page: 1, itemsPerPage: 50 },
                    []
                );
        }
        
    });
    
    test('Context parameter', async() => {
        expect.assertions(3);
        
        const objectManager = ObjectManager.getSingleton();
        
        const api = objectManager.getInstance(Api.Service);
        api.bootstrap();
        
        const controller : any = objectManager.getInstance(AuthorController);
        
        {
            const result = await controller.withContext({ foo: 1 }, { bar: 1 });
            expect(result).toStrictEqual(true);
            
            expect(spy)
                .toBeCalledTimes(1)
                .toHaveBeenLastCalledWith(
                    {
                        request: { foo: 1 },
                        response: { bar: 1 },
                    }
                );
        }
    });
    
});

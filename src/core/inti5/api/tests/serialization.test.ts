import { ObjectManager } from '@inti5/object-manager';
import { RuntimeException } from '@inti5/utils/Exception';
import * as Trans from 'class-transformer';
import * as Api from '../index';
import { Annotation as API } from '../index';


describe('Serialization', () => {
    afterEach(() => {
        ObjectManager.getSingleton()
            .releaseAll();
        
        const { DataDeserializer } = require('../Serialization/DataDeserializer');
        API.Deserializer()(DataDeserializer);
        
        const { ObjectSerializer } = require('../Serialization/ObjectSerializer');
        API.Serializer()(ObjectSerializer);
    });
    
    test('Basic serialization', async() => {
        @API.Resource()
        class Author
        {
            
            @API.Id()
            public id : number;
            
            @API.Property()
            @API.Groups([ 'Author' ])
            public name : string = 'John Doe';
            
            @API.Property({
                type: {},
                typeFn: () => [ String ],
            })
            @API.Groups([ 'Author:owner' ])
            public secret : string[] = [ 'secret' ];
            
            @API.Property(() => String, {
                transform: { toPlainOnly: true },
                transformFn: (params : Trans.TransformFnParams) => params.value + '!'
            })
            @API.Groups([ 'Author:*:get' ])
            public readonlyVar : string = 'readonly';
            
            @API.Property(() => String)
            @API.Groups([ '*:*:get' ])
            public sample : string = 'sample';
            
            @API.Property()
            @API.Groups([ '*:*:set' ])
            public setterOnly : string = 'sample';
            
            public excluded : number = 18;
            
        }
        
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        const object = new Author();
        object.id = 5;
        
        {
            const raw = await api.serialize(
                object,
                { endpoint: '*' }
            );
            
            expect(raw)
                .toStrictEqual({
                    '@type': 'Author',
                    '@id': '/author/5',
                    id: 5,
                    sample: 'sample',
                });
        }
        
        {
            const raw = await api.serialize(
                object,
                { endpoint: 'Author' }
            );
            
            expect(raw)
                .toStrictEqual({
                    '@type': 'Author',
                    '@id': '/author/5',
                    id: 5,
                    name: 'John Doe',
                    readonlyVar: 'readonly!',
                    sample: 'sample',
                });
        }
        
        {
            const raw = await api.serialize(
                object,
                { endpoint: 'Author', roles: [ 'owner' ] }
            );
            
            expect(raw)
                .toStrictEqual({
                    '@type': 'Author',
                    '@id': '/author/5',
                    id: 5,
                    name: 'John Doe',
                    secret: [ 'secret' ],
                    readonlyVar: 'readonly!',
                    sample: 'sample',
                });
        }
    });
    
    test('Nested serialization', async() => {
        @API.Resource()
        class Book
        {
            
            @API.Property()
            @API.Groups([ 'Author' ])
            public name : string;
            
        }
        
        @API.Resource('Author')
        class Author
        {
            
            @API.Property()
            @API.Groups([ 'Author' ])
            public name : string;
            
            @API.Property(() => [ Book ])
            @API.Groups([ 'Author' ])
            public books : Book[] = [];
            
        }
        
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        const author = new Author();
        author.name = 'W. Shakespeare';
        
        const book = new Book();
        book.name = 'Remeo & Julia';
        author.books.push(book);
        
        const raw = await api.serialize(
            author,
            { endpoint: 'Author' }
        );
        
        expect(raw)
            .toStrictEqual({
                '@type': 'Author',
                '@id': undefined,
                name: 'W. Shakespeare',
                books: [
                    {
                        '@type': 'Book',
                        '@id': undefined,
                        name: 'Remeo & Julia',
                    }
                ]
            });
    });
    
    test('Wrong configuration', async() => {
        class Author
        {
            @API.Property()
            public test : number = 5;
        }
        
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        const tryFn = () => api.bootstrap();
        
        const exception = new RuntimeException(
            'Resource Author is not configured well',
            1639589537680
        );
        expect(tryFn)
            .toThrow(exception);
    });
    
    test('Unknown resource while serialization', async() => {
        class Author
        {
            public test : number = 5;
        }
        
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        const object = new Author();
        
        const tryFn = () => api.serialize(
            object,
            { endpoint: '*' }
        );
        
        const exception = new RuntimeException(
            'Undefined resource Author',
            1639496936396
        );
        await expect(tryFn)
            .rejects
            .toThrow(exception);
    });
    
    test('Wrong serialization group syntax', async() => {
        @API.Resource()
        class Author
        {
            @API.Id()
            public id : number;
            
            @API.Property()
            @API.Groups([ 'wr!:ong!@' ])
            public prop : number;
        }
        
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        
        const tryFn = () => api.bootstrap();
        
        const exception = new RuntimeException(
            'Unable to parse serialization group wr!:ong!@ in Author::prop',
            1639499965219
        );
        expect(tryFn)
            .toThrow(exception);
    });
    
    test('Custom resource options configuration', async() => {
        @API.Resource(
            'Renamed',
            {
                path: 'custom_path',
                transform: {
                    ignoreDecorators: true,
                }
            }
        )
        class Author
        {
            @API.Property({
                expose: <any>true
            })
            public sample = 'ok';
        }
        
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        const object = new Author();
        const raw = await api.serialize(
            object,
            { endpoint: '*' }
        );
        
        expect(raw)
            .toStrictEqual({
                '@type': 'Renamed',
                '@id': undefined,
                sample: 'ok',
            });
    });
    
    test('Custom resource options configuration 2', async() => {
        @API.Resource({
            transform: <any>true
        })
        class Author
        {
            @API.Property({
                expose: <any>true
            })
            public sample = 'ok';
        }
        
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        const object = new Author();
        const raw = await api.serialize(
            object,
            { endpoint: '*' }
        );
        
        expect(raw)
            .toStrictEqual({
                '@type': 'Author',
                '@id': undefined,
            });
    });
    
});

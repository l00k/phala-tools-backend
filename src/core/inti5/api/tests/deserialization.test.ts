import { ObjectManager } from '@inti5/object-manager';
import { RuntimeException } from '@inti5/utils/Exception';
import * as Trans from 'class-transformer';
import * as Api from '../index';
import { Annotation as API } from '../index';

describe('Deserialization', () => {
    afterEach(() => {
        ObjectManager.getSingleton()
            .releaseAll();
        
        const { DataDeserializer } = require('../Serialization/DataDeserializer');
        API.Deserializer()(DataDeserializer);
        
        const { ObjectSerializer } = require('../Serialization/ObjectSerializer');
        API.Serializer()(ObjectSerializer);
    });
    
    test('Basic deserialization', async() => {
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
            
            @API.Groups([ 'Author:*:set' ])
            public writeonlyVar : string = 'initial';
            
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
        
        {
            const object = await api.deserialize(
                {
                    '@type': 'Author',
                    '@id': '/author/5',
                    id: 5,
                    name: 'Johny Bravo',
                    secret: [ 'hacked' ],
                    readonlyVar: 'hacked',
                    writeonlyVar: 'changed',
                    setterOnly: 'writable',
                    excluded: 42,
                    hacked: true,
                },
                { endpoint: '*' }
            );
            
            expect(object)
                .toBeInstanceOf(Author)
                .toMatchObject({
                    '@type': 'Author',
                    '@id': '/author/5',
                    id: 5,
                    name: 'John Doe',
                    secret: [ 'secret' ],
                    readonlyVar: 'readonly',
                    writeonlyVar: 'initial',
                    sample: 'sample',
                    setterOnly: 'writable',
                    excluded: 18,
                })
                .not.toMatchObject({
                hacked: true,
            });
        }
        
        {
            const object = await api.deserialize(
                {
                    '@type': 'Author',
                    '@id': '/author/5',
                    id: 5,
                    name: 'Johny Bravo',
                    secret: [ 'hacked' ],
                    readonlyVar: 'hacked',
                    writeonlyVar: 'changed',
                    setterOnly: 'writable',
                    excluded: 42,
                    hacked: true,
                },
                { endpoint: 'Author' }
            );
            
            expect(object)
                .toBeInstanceOf(Author)
                .toMatchObject({
                    '@type': 'Author',
                    '@id': '/author/5',
                    id: 5,
                    name: 'Johny Bravo',
                    secret: [ 'secret' ],
                    readonlyVar: 'readonly',
                    writeonlyVar: 'changed',
                    sample: 'sample',
                    setterOnly: 'writable',
                    excluded: 18,
                })
                .not.toMatchObject({
                hacked: true,
            });
        }
        
        {
            const object = await api.deserialize(
                {
                    '@type': 'Author',
                    '@id': '/author/5',
                    id: 5,
                    name: 'Johny Bravo',
                    secret: [ 'changed' ],
                    readonlyVar: 'hacked',
                    writeonlyVar: 'changed',
                    setterOnly: 'writable',
                    excluded: 42,
                    hacked: true,
                },
                { endpoint: 'Author', roles: [ 'owner' ] }
            );
            
            expect(object)
                .toBeInstanceOf(Author)
                .toMatchObject({
                    '@type': 'Author',
                    '@id': '/author/5',
                    id: 5,
                    name: 'Johny Bravo',
                    secret: [ 'changed' ],
                    readonlyVar: 'readonly',
                    writeonlyVar: 'changed',
                    sample: 'sample',
                    setterOnly: 'writable',
                    excluded: 18,
                })
                .not.toMatchObject({
                hacked: true,
            });
        }
    });
    
    test('Nested deserialization', async() => {
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
        
        const raw = {
            '@type': 'Author',
            name: 'W. Shakespeare',
            books: [
                {
                    '@type': 'Book',
                    name: 'Remeo & Julia',
                }
            ]
        };
        
        const object = await api.deserialize<Author>(raw, { endpoint: 'Author' });
        
        expect(object)
            .toBeInstanceOf(Author)
            .toMatchObject({
                name: 'W. Shakespeare',
            });
        
        expect(object.books)
            .toBeInstanceOf(Array);
        
        expect(object.books[0])
            .toBeInstanceOf(Book)
            .toMatchObject({
                name: 'Remeo & Julia',
            });
    });
    
    test('Unknown resource while deserialization', async() => {
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        const tryFn = () => api.deserialize(
            {},
            { endpoint: '*' }
        );
        
        const exception = new RuntimeException(
            'Unable to get @type from specified data',
            1639497820450
        );
        await expect(tryFn)
            .rejects
            .toThrow(exception);
    });
    
    test('Unknown resource while deserialization 2', async() => {
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        const tryFn = () => api.deserialize(
            { '@type': 'Sample' },
            { endpoint: '*' }
        );
        
        const exception = new RuntimeException(
            'Undefined resource of type Sample',
            1639594634016
        );
        await expect(tryFn)
            .rejects
            .toThrow(exception);
    });
    
    test('Unknown resource while deserialization 3', async() => {
        class Sample
        {
        }
        
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        const tryFn = () => api.deserialize(
            { test: 'ok' },
            { endpoint: '*' }
        );
        
        const exception = new RuntimeException(
            `Unable to get ${Api.TYPE_APIKEY} from specified data`,
            1639497820450
        );
        await expect(tryFn)
            .rejects
            .toThrow(exception);
    });
});

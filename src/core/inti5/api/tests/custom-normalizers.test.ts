import { ObjectManager } from '@inti5/object-manager';
import { RuntimeException } from '@inti5/utils/Exception';
import * as Api from '../index';
import { Annotation as API } from '../index';


describe('Custom serialization process', () => {
    afterEach(() => {
        ObjectManager.getSingleton()
            .releaseAll();
        
        const { DataDeserializer } = require('../Serialization/DataDeserializer');
        API.Deserializer()(DataDeserializer);
        
        const { ObjectSerializer } = require('../Serialization/ObjectSerializer');
        API.Serializer()(ObjectSerializer);
    });
    
    test('Custom deserializer before main', async() => {
        
        @API.Resource()
        class Author
        {
            
            @API.Id()
            public id : number;
            
            @API.Property()
            @API.Groups([ 'Author' ])
            public name : string = 'John Doe';
            
        }
        
        const map : { [key : string] : Author } = {};
        
        map['/author/1'] = new Author();
        map['/author/1'].id = 1;
        map['/author/1'].name = 'Albert';
        
        map['/author/2'] = new Author();
        map['/author/2'].id = 2;
        map['/author/2'].name = 'Mark';
        
        @API.Deserializer({
            priority: -100
        })
        class SampleDeserializer
            extends Api.DeserializationProcessor
        {
            public async process<T> (
                inputData : any,
                context : Api.SerializationContext,
                options? : Api.SerializationOptions
            ) : Promise<any>
            {
                if (!map[inputData]) {
                    throw new RuntimeException('Could not be loaded', 1639751903540);
                }
                
                return map[inputData];
            }
            
            public canHandle (
                inputData : any,
                context : Api.SerializationContext,
            ) : boolean
            {
                return typeof inputData == 'string';
            }
        }
        
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        {
            const object : Author = await api.deserialize(
                '/author/1',
                { endpoint: 'Author' }
            );
            
            expect(object)
                .toBeInstanceOf(Author)
                .toMatchObject({
                    '@type': 'Author',
                    '@id': '/author/1',
                    id: 1,
                    name: 'Albert',
                });
        }
        
        {
            const tryFn = () => api.deserialize(
                '/author/531',
                { endpoint: 'Author' }
            );
            
            await expect(tryFn)
                .rejects
                .toThrow(RuntimeException);
        }
    });
    
    test('Custom serializer after main', async() => {
        
        @API.Resource()
        class Author
        {
            
            @API.Id()
            public id : number;
            
            @API.Property()
            @API.Groups([ 'Author' ])
            public name : string = 'John Doe';
            
        }
        
        @API.Serializer({
            priority: 100
        })
        class SampleSerializer
            extends Api.SerializationProcessor
        {
            public async process<T> (
                inputData : any,
                context : Api.SerializationContext,
                options? : Api.SerializationOptions
            ) : Promise<any>
            {
                inputData.name += ' Einstain';
                return inputData;
            }
            
            public canHandle (
                inputData : any,
                context : Api.SerializationContext,
            ) : boolean
            {
                return inputData[Api.TYPE_APIKEY] == 'Author';
            }
        }
        
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        {
            const object = new Author();
            object.id = 1;
            object.name = 'Albert';
            
            const raw = await api.serialize(
                object,
                { endpoint: 'Author' }
            );
            
            expect(raw)
                .toStrictEqual({
                    '@type': 'Author',
                    '@id': '/author/1',
                    id: 1,
                    name: 'Albert Einstain',
                });
        }
    });
});

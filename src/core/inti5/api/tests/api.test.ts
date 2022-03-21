import { ObjectManager } from '@inti5/object-manager';
import * as Api from '../index';
import { Annotation as API } from '../index';

describe('Api service', () => {
    @API.Resource('Auuthor')
    class Author
    {
        
        @API.Id()
        public id : number;
        
        @API.Property()
        public name : string;
        
    }
    
    test('Singleton', () => {
        const objectManager = ObjectManager.getSingleton();
        const instance = objectManager.getInstance(Api.Service);
        
        expect(objectManager.getInstance(Api.Service))
            .toStrictEqual(instance);
    });
    
    test('Resource getters', async() => {
        const api = ObjectManager.getSingleton().getInstance(Api.Service);
        api.bootstrap();
        
        expect([...api.getResources().values()][0])
            .toMatchObject({
                name: 'Auuthor',
                path: '/auuthor',
                idProperty: 'id',
                properties: {
                    id: {},
                    name: {},
                }
            });
        
        expect(api.getResourcesNameMap())
            .toMatchObject({
                Auuthor: Author,
            });
    });
});

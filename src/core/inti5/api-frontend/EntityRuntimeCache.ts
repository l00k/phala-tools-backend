import { ID_APIKEY, MetadataStorage } from '@inti5/api';
import { Inject, Singleton } from '../object-manager';


@Singleton()
export class EntityRuntimeCache
{
    
    @Inject()
    protected metadataStorage : MetadataStorage;
    
    protected cache : { [id : string] : Object } = {};
    
    
    public cacheEntities (entities : Object[])
    {
        for (const entity of entities) {
            const idPath = entity[ID_APIKEY];
            if (idPath) {
                this.cache[idPath] = entity;
            }
        }
    }
    
    public getCachedEntity (id : string) : Object
    {
        return this.cache[id];
    }
    
}

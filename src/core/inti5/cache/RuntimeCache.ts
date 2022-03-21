import { RuntimeException } from '@inti5/utils/Exception';
import { EntryConfig } from './def';
import Hashes from 'jshashes';


type CacheEntryKey = string;

type CacheEntries = {
    [key : CacheEntryKey] : {
        promise? : any|Promise<any>
        value? : any,
        createdAt : number,
        lifetime : number,
    }
}

type EntryLambda<T> = () => T;

type EntryAsyncLambda<T> = () => T|Promise<T>;


export class RuntimeCache<T = any>
{
    
    protected entries : CacheEntries = {};
    
    
    public clear ()
    {
        this.entries = {};
    }
    
    public async get<Tm extends T> (rawEntryKey : any, entryLambda : EntryAsyncLambda<Tm>, config : EntryConfig = {}) : Promise<Tm>
    {
        const key = this.getHash(rawEntryKey);
    
        config = this.prepareConfig(config);
        
        // return cached value if not expired
        if (this.entries[key]) {
            if (!this.entries[key].lifetime) {
                await this.entries[key].promise;
                return this.entries[key].value;
            }
            
            const deltaTime = (Date.now() - this.entries[key].createdAt) / 1000;
            if (deltaTime < this.entries[key].lifetime) {
                await this.entries[key].promise;
                return this.entries[key].value;
            }
        }
        
        const promise = entryLambda();
        
        this.entries[key] = {
            promise,
            value: undefined,
            createdAt: Date.now(),
            lifetime: config.lifetime
        };
        
        this.entries[key].value = await promise;
        
        return this.entries[key].value;
    }
    
    public getSync<Tm extends T> (rawEntryKey : any, entryLambda : EntryLambda<Tm>, config : EntryConfig = {}) : Tm
    {
        const key = this.getHash(rawEntryKey);
        
        config = this.prepareConfig(config);
        
        // return cached value if not expired
        if (this.entries[key]) {
            if (!this.entries[key].lifetime) {
                return this.entries[key].value;
            }
            
            const deltaTime = (Date.now() - this.entries[key].createdAt) / 1000;
            if (deltaTime < this.entries[key].lifetime) {
                return this.entries[key].value;
            }
        }
        
        const value = entryLambda();
        
        this.entries[key] = {
            value,
            createdAt: Date.now(),
            lifetime: config.lifetime
        };
        
        return this.entries[key].value;
    }
    
    
    public pullMultiple<Tm extends T> (keys : CacheEntryKey[]) : Tm[]
    {
        return keys.map(key => {
            if (!this.entries[key]) {
                throw new RuntimeException(`Entity not found for given key ${key}`, 1638497794091);
            }
            
            return this.entries[key].value;
        });
    }
    
    public pullAll<Tm extends T> () : Tm[]
    {
        return Object.values(this.entries)
            .map(e => e.value);
    }
    
    
    protected getHash(...args : any[]) : string
    {
        return new Hashes.MD5().hex(JSON.stringify(args));
    }
    
    protected prepareConfig (config : EntryConfig) : EntryConfig
    {
        return {
            lifetime: 0,
            ...config,
        };
    }
    
}

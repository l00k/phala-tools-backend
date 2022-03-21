import { Inject } from '@inti5/object-manager';
import * as Trans from 'class-transformer';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import pluralize from 'pluralize';
import { ResourceDescription } from '../api';
import { RuntimeCache } from '../cache';
import { CollectionRequest, Pagination } from './Domain';
import { Exception } from './Exception';
import { HttpClient } from './HttpClient';
import { Service } from './Service';
import Hashes from 'jshashes';


export type Filters<T> = {}

export type Collection<T> = {
    items : T[],
    total : number,
}


export class ApiConsumer<T>
{
    
    public static readonly RESOURCE;
    
    public static getDefaultPagination () : Pagination
    {
        return new Pagination();
    }
    
    
    @Inject()
    protected api : Service;
    
    @Inject({ name: 'api.client' })
    protected apiClient : HttpClient;
    
    @Inject({ name: 'api.cache' })
    protected runtimeCache : RuntimeCache;
    
    
    public get resource () : ResourceDescription
    {
        const Service : typeof ApiConsumer = <any>this.constructor;
        return this.api.getResources().get(Service.RESOURCE);
    }
    
    public async getItem (
        id : number | string,
        path? : string
    ) : Promise<T>
    {
        const Service : typeof ApiConsumer = <any>this.constructor;
        
        if (!path) {
            path = this.resource.path + '/' + id;
        }
        
        const cacheKey = [ Service.RESOURCE.name, 'getItem', id, path ];
        const response = await this.runtimeCache.get(cacheKey, async() => {
            const response = await this.apiClient.get(path);
            if (response.status !== 200) {
                throw new Exception('Didn\'t get proper response', 1642097574801);
            }
            
            return response;
        }, { lifetime: 60 });
        
        return await this.api.deserialize<T>(
            cloneDeep(response.data),
            { endpoint: this.resource.name },
            { transformOptions: { ignoreDecorators: true } }
        );
    }
    
    public async getCollection (
        request? : CollectionRequest<T>,
        path? : string
    ) : Promise<Collection<T>>
    {
        const Service : typeof ApiConsumer = <any>this.constructor;
        
        if (!request) {
            request = new CollectionRequest<T>();
        }
        if (!request.pagination) {
            request.pagination = Service.getDefaultPagination();
        }
        
        if (!path) {
            path = pluralize(this.resource.path);
        }
        
        const plainRequest = request.toPlain();
        
        const cacheKey = [ Service.RESOURCE.name, 'getCollection', plainRequest, path ];
        const response = await this.runtimeCache.get(cacheKey, async() => {
            const response = await this.apiClient.post(path, plainRequest);
            if (response.status !== 200) {
                throw new Exception('Didn\'t get proper response', 1641204630492);
            }
            
            return response;
        }, { lifetime: 60 });
        
        const items = await this.api.deserialize<T[]>(
            cloneDeep(response.data.items),
            { endpoint: this.resource.name },
            { transformOptions: { ignoreDecorators: true } }
        );
        
        return {
            items,
            total: response.data.total,
        };
    }
    
    public async* getFetcher (
        request? : CollectionRequest<T>,
        path? : string
    ) : AsyncGenerator<T[], void, void>
    {
        const Service : typeof ApiConsumer = <any>this.constructor;
        
        if (!request) {
            request = new CollectionRequest<T>();
        }
        if (!request.pagination) {
            request.pagination = Service.getDefaultPagination();
        }
        
        let counter = 0;
        
        while (true) {
            const collection = await this.getCollection(request, path);
            if (!collection.items.length) {
                break;
            }
            
            yield collection.items;
            
            counter += collection.items.length;
            if (counter >= collection.total) {
                break;
            }
            
            ++request.pagination.page;
        }
    }
    
}

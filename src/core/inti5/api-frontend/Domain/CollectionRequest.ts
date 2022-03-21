import * as Trans from 'class-transformer';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import { flatternObject } from '@inti5/utils/flattenObject';
import { unflatternObject } from '@inti5/utils/unflattenObject';
import { replaceRecursive } from '@inti5/utils/replaceRecursive';
import { Filters } from './Filters';
import { Pagination } from './Pagination';
import { Sorting } from './Sorting';


@Trans.Exclude()
export class CollectionRequest<T>
{
    
    @Trans.Expose()
    public filters : Filters<T>;
    
    @Trans.Expose()
    public sorting : Sorting<T>;
    
    @Trans.Expose()
    @Trans.Type(() => Pagination)
    public pagination : Partial<Pagination>;
    
    @Trans.Expose()
    public modifiers : any = {};
    
    
    public constructor (data? : Partial<CollectionRequest<T>>)
    {
        if (data?.filters) {
            this.filters = data?.filters;
        }
        if (data?.sorting) {
            this.sorting = data?.sorting;
        }
        if (data?.pagination) {
            this.pagination = data?.pagination;
        }
        if (data?.modifiers) {
            this.modifiers = data?.modifiers;
        }
    }
    
    public toPlain() : Partial<CollectionRequest<T>>
    {
        const snapshot = cloneDeep(this);
        
        // strip empty filters
        const stripEmptyObjects = (node : Object) => {
            for (const prop in node) {
                if (typeof node[prop] == 'string') {
                    if (node[prop] === '') {
                        delete node[prop];
                    }
                }
                
                if (node[prop] instanceof Object) {
                    stripEmptyObjects(node[prop]);
                    
                    if (isEmpty(node[prop])) {
                        delete node[prop];
                    }
                }
            }
            
            // special array handling
            if (node instanceof Array) {
                for (let i = 0; i < node.length; ++i) {
                    if (node[i] === undefined) {
                        node.splice(i, 1);
                        --i;
                    }
                }
            }
        };
        
        let plain = Trans.instanceToPlain(snapshot);
        plain = JSON.parse(JSON.stringify(plain));
        
        stripEmptyObjects(plain.filters);
        
        return plain;
    }
    
    public toPlainString(base64 : boolean = false) : string
    {
        const plainString = JSON.stringify(this.toPlain());
        return base64
            ? new Buffer(plainString).toString('base64')
            : encodeURIComponent(plainString);
    }
    
    public fromPlainString(plainString : string, base64 : boolean = false)
    {
        const raw : any = base64
            ? new Buffer(plainString, 'base64').toString()
            : decodeURIComponent(plainString);
            
        const object = JSON.parse(raw);
        
        if (object.filters) {
            replaceRecursive(this.filters, object.filters)
        }
        if (object.sorting) {
            replaceRecursive(this.sorting, object.sorting);
        }
        if (object.pagination) {
            this.pagination = Trans.plainToClassFromExist(this.pagination, object.pagination);
        }
        if (object.modifiers) {
            replaceRecursive(this.modifiers, object.modifiers);
        }
    }
    
}

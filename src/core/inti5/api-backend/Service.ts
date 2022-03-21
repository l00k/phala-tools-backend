import { ApiConfig, PropertyDescription, Service as BaseService } from '@inti5/api';
import { Inject, Singleton } from '@inti5/object-manager';
import { RuntimeException } from '@inti5/utils/Exception';
import { Assert } from '@inti5/validator/Object';
import * as ORM from '@mikro-orm/core';
import * as Trans from 'class-transformer';
import { Filterable, Sortable } from './Annotation';
import * as Def from './def';
import { ClassConstructor, TypeFn } from './def';
import * as Domain from './Domain';
import { MetadataStorage } from './MetadataStorage';


type CollectionRequestKey = { type : Function, pagination : string };


@Singleton()
export class Service
    extends BaseService
{
    
    @Inject()
    protected extMetadataStorage : MetadataStorage;
    
    protected filters : Map<Function, Trans.ClassConstructor<any>> = new Map();
    protected sortings : Map<Function, Trans.ClassConstructor<any>> = new Map();
    protected paginations : { [key : string] : typeof Domain.Pagination } = {};
    
    
    public bootstrap (config : Partial<ApiConfig> = {})
    {
        return super.bootstrap(config);
    }
    
    /*
     * Collection fetching tools
     */
    
    public getFiltersClass (typeFn : TypeFn, Base : ClassConstructor = Object) : Trans.ClassConstructor<any>
    {
        const Type = typeFn();
        
        if (!this.filters.has(Type)) {
            const FiltersImpl = this.buildFiltersClass(Type, Base);
            this.filters.set(Type, FiltersImpl);
        }
        
        return this.filters.get(Type);
    }
    
    protected buildFiltersClass (Type : Function, Base : ClassConstructor) : Trans.ClassConstructor<any>
    {
        const resource = this.metadataStorage.resources.get(Type);
        if (!resource) {
            throw new RuntimeException(`Undefined resource ${Type.name}`, 1641462826518);
        }
        
        class FiltersImpl extends Base {};
        
        // add default filterable by idProperty
        let filterables = this.extMetadataStorage.filterableRegistry.get(Type) ?? {};
        
        if (!filterables[resource.idProperty]) {
            Filterable()(Type.prototype, resource.idProperty);
            filterables = this.extMetadataStorage.filterableRegistry.get(Type);
        }
        
        // properties
        for (const [ property, filterable ] of Object.entries(filterables)) {
            const propertyDescription = resource.properties[property];
            if (!propertyDescription) {
                throw new RuntimeException(`Undefined property ${property} in ${resource.name} resource`, 1641485395138);
            }
            
            const isComplex = this.checkComplexType(propertyDescription);
            if (isComplex) {
                const PropertyFilterClass = this.getFiltersClass(propertyDescription.typeFn);
                
                Reflect.defineMetadata('design:type', PropertyFilterClass, FiltersImpl.prototype, property);
                Assert({}, () => PropertyFilterClass, { validateType: false })(FiltersImpl.prototype, property);
            }
            else {
                class PropertyImpl {};
                
                // setup default operators
                let operators = filterable.operators;
                if (!operators) {
                    const Type = resource.properties[property].typeFn();
                    
                    if (Type === Boolean) {
                        operators = Def.BOOLEAN_DEFAULT_FILTERS;
                    }
                    else if (Type === Number) {
                        operators = Def.NUMBER_DEFAULT_FILTERS;
                    }
                    else if (Type === String) {
                        operators = Def.STRING_DEFAULT_FILTERS;
                    }
                    else if (Type === Date) {
                        operators = Def.DATE_DEFAULT_FILTERS;
                    }
                    else {
                        operators = Def.DEFAULT_FILTERS;
                    }
                }
                
                for (const operator of operators) {
                    const isArray = Def.ARRAY_OPERATORS.includes(operator);
                    
                    const PropertyType = isArray
                        ? Array
                        : propertyDescription.typeFn();
                    Reflect.defineMetadata('design:type', PropertyType, PropertyImpl.prototype, operator);
                    
                    Assert({}, propertyDescription.typeFn, { isArray })(PropertyImpl.prototype, operator);
                    Trans.Type()(PropertyImpl.prototype, operator);
                }
                
                Reflect.defineMetadata('design:type', PropertyImpl, FiltersImpl.prototype, property);
                Assert({}, { validateType: false })(FiltersImpl.prototype, property);
            }
        }
        
        // logical operators
        for (const operator of Def.LOGICAL_OPERATORS) {
            const isArray = Def.ARRAY_OPERATORS.includes(operator);
            
            const PropertyType = isArray
                ? Array
                : FiltersImpl;
            Reflect.defineMetadata('design:type', PropertyType, FiltersImpl.prototype, operator);
            
            Assert({}, () => FiltersImpl, { validateType: false, isArray })(FiltersImpl.prototype, operator);
        }
        
        return FiltersImpl;
    }
    
    public getSortingClass (typeFn : TypeFn, Base : ClassConstructor = Object) : Trans.ClassConstructor<any>
    {
        const Type = typeFn();
        
        if (!this.sortings.has(Type)) {
            const SortingImpl = this.buildSortingClass(Type, Base);
            this.sortings.set(Type, SortingImpl);
        }
        
        return this.sortings.get(Type);
    }
    
    protected buildSortingClass (Type : Function, Base : ClassConstructor) : Trans.ClassConstructor<any>
    {
        const resource = this.metadataStorage.resources.get(Type);
        if (!resource) {
            throw new RuntimeException(`Undefined resource ${Type.name}`, 1641485436801);
        }
        
        class SortingImpl extends Base {}
        
        // add default sortable by idProperty
        let sortables = this.extMetadataStorage.sortableRegistry.get(Type) ?? {};
        
        if (!sortables[resource.idProperty]) {
            Sortable()(Type.prototype, resource.idProperty);
            sortables = this.extMetadataStorage.sortableRegistry.get(Type);
        }
        
        // properties
        for (const [ property, sortable ] of Object.entries(sortables)) {
            const propertyDescription = resource.properties[property];
            if (!propertyDescription) {
                throw new RuntimeException(`Undefined property ${property} in ${resource.name} resource`, 1641485424509);
            }
            
            const isComplex = this.checkComplexType(propertyDescription);
            if (isComplex) {
                const PropertySortingClass = this.getSortingClass(propertyDescription.typeFn);
                
                Reflect.defineMetadata('design:type', PropertySortingClass, SortingImpl.prototype, property);
                Assert({}, () => PropertySortingClass, { validateType: false })(SortingImpl.prototype, property);
            }
            else {
                Reflect.defineMetadata('design:type', String, SortingImpl.prototype, property);
                Assert({ inclusion: sortable.operators })(SortingImpl.prototype, property);
                Trans.Type()(SortingImpl.prototype, property);
            }
        }
        
        return SortingImpl;
    }
    
    public getPaginationClass (
        itemsPerPageOptions : number[],
        defaultItemsPerPage : number
    ) : typeof Domain.Pagination
    {
        const key = itemsPerPageOptions.join('.') + '-' + defaultItemsPerPage;
        if (!this.paginations[key]) {
            this.paginations[key] = this.buildPaginationClass(itemsPerPageOptions, defaultItemsPerPage);
        }
        
        return this.paginations[key];
    }
    
    protected buildPaginationClass (
        itemsPerPageOptions : number[],
        defaultItemsPerPage : number
    ) : typeof Domain.Pagination
    {
        class PaginationImpl
            extends Domain.Pagination
        {
            @Assert({
                presence: true,
                numericality: {
                    onlyInteger: true,
                    greaterThanOrEqualTo: 1,
                }
            })
            @Trans.Type()
            public page : number = 1;
            
            @Assert({
                presence: true,
                numericality: {
                    onlyInteger: true,
                },
                inclusion: itemsPerPageOptions
            })
            @Trans.Type()
            public itemsPerPage : number = defaultItemsPerPage;
        };
        
        return PaginationImpl;
    }
    
    protected checkComplexType(propertyDescription : PropertyDescription)
    {
        return propertyDescription.typeFn
            && !!this.metadataStorage.resources.get(propertyDescription.typeFn());
    }
    
}

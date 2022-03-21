import { Singleton } from '../object-manager';
import { mergeRecursive } from '../utils/mergeRecursive';
import { FilterableDescription, SortableDescription } from './def';


type Filterables = { [property : string] : FilterableDescription };
type Sortables = { [property : string] : SortableDescription };

@Singleton()
export class MetadataStorage
{
    
    public filterableRegistry : Map<Function, Filterables> = new Map();
    public sortableRegistry : Map<Function, Sortables> = new Map();
    
    
    public registerFilterable (
        TargetConstructor : Function,
        property : string,
        config : FilterableDescription,
    )
    {
        let filterables = this.filterableRegistry.get(TargetConstructor);
        if (!filterables) {
            filterables = {};
            this.filterableRegistry.set(TargetConstructor, filterables);
        }
        
        let filterable = filterables[property];
        if (!filterable) {
            filterable = <any>{};
            filterables[property] = filterable;
        }
        
        mergeRecursive(filterable, config);
    }
    
    public registerSortable (
        TargetConstructor : Function,
        property : string,
        config : SortableDescription,
    )
    {
        let sortables = this.sortableRegistry.get(TargetConstructor);
        if (!sortables) {
            sortables = {};
            this.sortableRegistry.set(TargetConstructor, sortables);
        }
        
        let sortable = sortables[property];
        if (!sortable) {
            sortable = <any>{};
            sortables[property] = sortable;
        }
        
        mergeRecursive(sortable, config);
    }
    
}

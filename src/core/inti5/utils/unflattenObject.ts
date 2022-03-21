import { accessThroughPath } from './accessThroughPath';

type NestedObject = {
    [key : string | number | symbol] : NestedObject | any;
}

type FlatObject = {
    [key : string] : undefined | null | boolean | string | number | Date | RegExp | Object;
}

export function unflatternObject (flat : FlatObject) : NestedObject
{
    let nested : NestedObject = {};
    
    for (const [ path, value ] of Object.entries(flat)) {
        const parts = path.split('.');
        const leaf = parts.pop();
        const parentField = parts.join('.');
        const parent = accessThroughPath(nested, parentField, true);
        parent[leaf] = value;
    }
    
    return nested;
}

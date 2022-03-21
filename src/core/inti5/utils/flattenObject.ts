import { isPlainObject } from './common';

type NestedObject = {
    [key : string | number | symbol] : NestedObject | any;
}

type FlatObject = {
    [key : string] : undefined | null | boolean | string | number | Date | RegExp | Object;
}

export function flatternObject (object : NestedObject, path : string = ''): FlatObject
{
    let flat : FlatObject = {};
    
    for (const key in object) {
        let nodePath = path + (path ? '.' : '') + key;
        
        if (isPlainObject(object[key])) {
            const child = flatternObject(object[key]);
            for (const skey in child) {
                flat[`${nodePath}.${skey}`] = child[skey];
            }
        }
        else {
            flat[nodePath] = object[key];
        }
    }
    
    return flat;
}

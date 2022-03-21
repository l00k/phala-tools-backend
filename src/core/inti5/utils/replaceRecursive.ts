import mergeWith from 'lodash/mergeWith';

export function replaceRecursive<T>(target : Partial<T>, ...source : Partial<T>[]): T
{
    return mergeWith(target, ...source, (obj, src) : any => {
        if (src instanceof Array) {
            return src;
        }
    })
}

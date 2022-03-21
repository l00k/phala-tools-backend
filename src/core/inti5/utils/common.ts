export function isPlainObject (v : any) : boolean
{
    return (!!v) && (v.constructor === Object);
}

export function isFunction (v : any) : boolean
{
    return !!(v && v.constructor && v.call && v.apply);
}

export function isArrowFunction (v : any) : boolean
{
    let native = v.toString().trim().endsWith('() { [native code] }');
    let plain = !native && v.hasOwnProperty('prototype');
    return isFunction(v) && !(native || plain);
}

export function isIterable (v : any) : boolean
{
    return v != null && typeof v[Symbol.iterator] === 'function';
}

export function isKeyIterable (v : any) : boolean
{
    return v instanceof Object;
}

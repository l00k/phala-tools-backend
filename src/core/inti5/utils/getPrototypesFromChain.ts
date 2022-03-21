export function getPrototypesFromChain(Source : Object): Object[]
{
    let collection = [];
    
    let Prototype = Source;
    do {
        collection.push(Prototype);
        Prototype = Object.getPrototypeOf(Prototype);
    }
    while (Prototype !== Object.prototype);
    
    return collection;
}

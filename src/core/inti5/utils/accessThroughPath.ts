import { Exception } from './Exception';

export function accessThroughPath (obj : any, path : string, autoCreate : boolean = false)
{
    const parts = path.split('.');
    
    let part = null;
    
    while (part = parts.shift()) {
        if (!obj[part]) {
            if (autoCreate) {
                obj[part] = {};
            }
            else {
                throw new Exception(`Undefined node at ${part}`, 1641922707436);
            }
        }
        
        obj = obj[part];
    }
    
    return obj;
}

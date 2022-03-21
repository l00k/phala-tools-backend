import { ObjectManager } from '@inti5/object-manager';
import { MetadataStorage } from '../MetadataStorage';
import { ResourceOptions } from '../def';


function Resource () : ClassDecorator;
function Resource (name : string) : ClassDecorator;
function Resource (options : ResourceOptions) : ClassDecorator;
function Resource (name : string, options : ResourceOptions) : ClassDecorator;


function Resource () : ClassDecorator
{
    let name : string = undefined;
    let options : ResourceOptions = {};
    
    if (arguments.length == 1) {
        if (typeof arguments[0] == 'string') {
            name = arguments[0].toString();
        }
        else {
            options = arguments[0];
        }
    }
    else if (arguments.length == 2) {
        name = arguments[0];
        options = arguments[1];
    }
    
    return (ClassConstructor : Function) => {
        const api = ObjectManager.getSingleton().getInstance(MetadataStorage);
        
        api.registerResource(
            ClassConstructor,
            name,
            options
        );
    };
}

export { Resource };

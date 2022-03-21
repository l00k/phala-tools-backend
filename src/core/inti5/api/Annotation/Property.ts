import { ObjectManager } from '@inti5/object-manager';
import * as Trans from 'class-transformer';
import { MetadataStorage } from '../MetadataStorage';
import { PropertyOptions } from '../def';


function Property () : PropertyDecorator;
function Property (
    typeFn : (type? : Trans.TypeHelpOptions) => any,
    options? : PropertyOptions
) : PropertyDecorator;
function Property (
    options : PropertyOptions
) : PropertyDecorator;

function Property () : PropertyDecorator
{
    let typeFn : (type? : Trans.TypeHelpOptions) => any = null;
    let options : Partial<PropertyOptions> = {};
    
    if (arguments.length == 1) {
        if (arguments[0] instanceof Function) {
            typeFn = arguments[0];
        }
        else {
            options = arguments[0];
        }
    }
    else if (arguments.length >= 2) {
        typeFn = arguments[0];
        options = {
            ...options,
            ...arguments[1]
        };
    }
    
    // uniform options
    options = {
        type: true,
        typeFn,
        ...options
    };
    
    // modify notation [ Object ] => Object (class-transformer convention)
    if (options.typeFn instanceof Function) {
        const Type = options.typeFn();
        if (Type instanceof Array) {
            options.typeFn = () => Type[0];
        }
    }
    else {
        options.typeFn = null;
    }
    
    return (ClassPrototype : any, property : string | symbol) => {
        const api = ObjectManager.getSingleton().getInstance(MetadataStorage);
        
        api.registerProperty(
            ClassPrototype.constructor,
            property,
            options,
        );
    };
}

export {
    Property
};


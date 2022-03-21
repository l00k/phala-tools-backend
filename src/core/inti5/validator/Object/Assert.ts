import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import { AssertionOptions, NestedRules } from '../def';
import { Validator } from '../Validator';

function Assert<T> (
    rules? : NestedRules<T>,
    typeFn? : false | (() => Object),
    options? : Partial<AssertionOptions>
) : PropertyDecorator;

function Assert<T> (
    rules? : NestedRules<T>,
    options? : Partial<AssertionOptions>
) : PropertyDecorator;


function Assert<T> (
    rules : NestedRules<T> = {}
) : PropertyDecorator
{
    let typeFn : false | (() => Object) = undefined;
    let options : Partial<AssertionOptions> = {};
    
    if (arguments.length >= 2) {
        if (arguments[1] instanceof Function) {
            typeFn = arguments[1];
        }
        else if (arguments[1] === false) {
            typeFn = false;
        }
        else if (arguments.length == 2) {
            typeFn = false;
            options = arguments[1];
        }
    }
    if (arguments.length >= 3) {
       options = arguments[2];
    }
    
    return (Target : any, property : string | symbol) => {
        const [ ClassConstructor, ClassPrototype ] = getDecoratorTarget(Target);
        
        options = {
            isArray: false,
            isComplex: false,
            ...options,
        };
        
        if (typeFn === undefined) {
            const Type = Reflect.getMetadata('design:type', ClassPrototype, property);
            typeFn = () => Type;
        }
        if (typeFn) {
            if (typeof options.validateType === 'undefined') {
                options.validateType = true;
            }
            
            const Type = typeFn();
            if (Type instanceof Array) {
                options.isArray = true;
            }
        }
        else {
            typeFn = undefined;
        }
        
        Validator.getSingleton()
            .registerObjectPropertyAssertion(
                ClassConstructor,
                property,
                rules,
                <any> typeFn,
                <any> options,
            );
    };
}

export { Assert };

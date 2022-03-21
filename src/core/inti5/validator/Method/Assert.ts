import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import { AssertionOptions, NestedRules } from '../def';
import { Validator } from '../Validator';


function Assert<T> (
    rules? : NestedRules<T>,
    typeFn? : false | (() => Object),
    options? : Partial<AssertionOptions>
) : ParameterDecorator;

function Assert<T> (
    rules? : NestedRules<T>,
    options? : Partial<AssertionOptions>
) : ParameterDecorator;


function Assert<T> (
    rules : NestedRules<T> = {},
) : ParameterDecorator
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

    return (Target : any, method : string | symbol, parameterIdx : number) => {
        const [ ClassConstructor, ClassPrototype ] = getDecoratorTarget(Target);
        
        options = {
            isArray: false,
            isComplex: false,
            ...options,
        };
        
        if (typeFn === undefined) {
            const ParamTypes = Reflect.getMetadata('design:paramtypes', ClassPrototype, method);
            typeFn = () => ParamTypes[parameterIdx];
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
        
        if (typeof options.validateType === 'undefined') {
            options.validateType = false;
        }
        
        Validator.getSingleton()
            .registerMethodParameterAssertion(
                ClassConstructor,
                method,
                parameterIdx,
                rules,
                <any> typeFn,
                <any> options,
            );
    };
}

export { Assert };

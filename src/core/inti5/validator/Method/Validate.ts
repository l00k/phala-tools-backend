import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import { ValidationException } from '../ValidationException';
import { ValidationResult } from '../ValidationResult';
import { Validator } from '../Validator';


export function Validate (
    validateReturnType : boolean = false
) : MethodDecorator {
    return (Target : any, method : string | symbol, descriptor : PropertyDescriptor) => {
        const [ ClassConstructor, ClassPrototype ] = getDecoratorTarget(Target);
        
        const validator = Validator.getSingleton();
        
        const originalMethod = descriptor.value;
        descriptor.value = function(...params : any[]) {
            let result = new ValidationResult();
            
            result = validator.validateMethod(ClassConstructor, method, params);
            if (!result.valid) {
                throw new ValidationException('Parameters validation using specified rules failed', 1572985034861, result);
            }
            
            const returnValue = originalMethod.apply(this, params);
            
            if (validateReturnType) {
                const ReturnType = Reflect.getMetadata('design:returntype', ClassPrototype, method);
                
                const returnValid = validator.validateType(returnValue, ReturnType);
                if (!returnValid) {
                    result.valid = false;
                    result.errors['__return'] = [ { rule: 'type' } ];
                    
                    throw new ValidationException('Return value type validation failed', 1572985055963, result);
                }
            }
            
            return returnValue;
        };
    };
}

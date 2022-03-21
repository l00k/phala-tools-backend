import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';
import { Exception } from '@inti5/utils/Exception';
import {
    AssertionOptions,
    AssertObjectOptions,
    FunctionValidationConfig,
    ParameterValidationDef,
    PropertyValidationDef,
    Rules,
    ValidationDescription,
    ValidationError,
    ValidationErrorMap
} from './def';
import validateJsExt from './validateJsExt';
import { ValidationResult } from './ValidationResult';
import { getPrototypesFromChain } from '@inti5/utils/getPrototypesFromChain';


export class Validator
{
    
    protected static readonly STORAGE_KEY = 'Validator_xg8u5r5oGiHnpsg9jbIR59w9BAgo0wKw';
    
    
    protected descriptions : Map<Function, ValidationDescription> = new Map();
    
    
    public static getSingleton () : Validator
    {
        if (!globalThis[Validator.STORAGE_KEY]) {
            globalThis[Validator.STORAGE_KEY] = new Validator();
        }
        
        return globalThis[Validator.STORAGE_KEY];
    }
    
    
    protected initObject (TargetConstructor : Function)
    {
        if (!this.descriptions.get(TargetConstructor)) {
            const description = {
                allowUnspecifiedProperties: false,
                properties: {},
                methods: {},
            };
            
            this.descriptions.set(TargetConstructor, description);
        }
    }
    
    public validateType (
        value : any,
        Type : any
    ) : boolean
    {
        if (!Type) {
            throw new Exception('Type has to be defined', 1573658489606);
        }
        
        // null and undefined are valid here
        if ([ undefined, null ].includes(value)) {
            return true;
        }
        
        if (Type == Boolean) {
            return typeof value == 'boolean';
        }
        else if (Type == Number) {
            return typeof value == 'number';
        }
        else if (Type == BigInt) {
            return typeof value == 'bigint';
        }
        else if (Type == String) {
            return typeof value == 'string';
        }
        
        return (value instanceof Type.prototype.constructor);
    }
    
    /**
     * Object validation related section
     */
    public registerObjectOptions (
        TargetConstructor : Function,
        options : AssertObjectOptions = {}
    )
    {
        this.initObject(TargetConstructor);
        const description = this.descriptions.get(TargetConstructor);
        Object.assign(description, options);
    }
    
    public registerObjectPropertyAssertion (
        TargetConstructor : Function,
        property : string | symbol,
        rules : Rules,
        typeFn : () => Object,
        options : AssertionOptions
    )
    {
        this.initObject(TargetConstructor);
        
        const description = this.descriptions.get(TargetConstructor);
        if (!description.properties[property]) {
            description.properties[property] = {
                rules: {},
                typeFn,
                options
            };
        }
        
        merge(
            description.properties[property].rules,
            rules
        );
    }
    
    
    public validateObject (
        object : Object,
        ValidateAsClass? : Function,
        basePropertyPath : string = undefined,
    ) : ValidationResult
    {
        const TargetPrototype = ValidateAsClass
            ? ValidateAsClass.prototype
            : Object.getPrototypeOf(object);
        
        // collect asserts through entire prototype chain
        const description : ValidationDescription = <any> getPrototypesFromChain(TargetPrototype)
            .reduce((acc, Prototype) => {
                const _desc = this.descriptions.get(Prototype.constructor);
                return merge({}, _desc, acc);
            }, { properties: {}, methods: {} });
        
        // initialize result
        const result = new ValidationResult();
        
        // general object assertions
        if (!description.allowUnspecifiedProperties) {
            for (const property in object) {
                const Type = Reflect.getMetadata('design:type', TargetPrototype, property);
                if (!Type) {
                    const propertyErrorPath = [ basePropertyPath, property ]
                        .filter(a => !!a)
                        .join('.');
                    
                    result.errors[propertyErrorPath] = [ { rule: 'unspecifiedProperty' } ];
                    result.valid = false;
                }
            }
        }
        
        // no rules applied - return
        const propertyValidationDefs : { [property : string] : PropertyValidationDef } = description.properties;
        if (isEmpty(propertyValidationDefs)) {
            return result;
        }
        
        for (const property in propertyValidationDefs) {
            const { rules, typeFn, options } = propertyValidationDefs[property];
            const value = object[property];
            
            const propertyErrorPath = [ basePropertyPath, property ]
                .filter(a => !!a)
                .join('.');
                
            // determine property type
            let PropertyType = Reflect.getMetadata('design:type', TargetPrototype, property);
            if (typeFn) {
                PropertyType = typeFn();
                if (PropertyType instanceof Array) {
                    PropertyType = PropertyType[0];
                }
            }
            
            // examine array of element or single element
            if (options.isArray) {
                if (!(value instanceof Array)) {
                    if (![ null, undefined ].includes(value)) {
                        result.errors[propertyErrorPath] = [ { rule: 'type' } ];
                    }
                }
                else {
                    for (const [ idx, subValue ] of Object.entries(value)) {
                        const subPath = [ propertyErrorPath, idx ].join('.');
                        
                        const errors = this.validateSingle(
                            subValue,
                            PropertyType,
                            { rules, options },
                            subPath
                        );
                        if (!isEmpty(errors)) {
                            result.errors = {
                                ...result.errors,
                                ...errors
                            };
                        }
                    }
                }
            }
            else {
                const errors = this.validateSingle(
                    value,
                    PropertyType,
                    { rules, options },
                    propertyErrorPath
                );
                result.errors = {
                    ...result.errors,
                    ...errors
                };
            }
        }
        
        if (!isEmpty(result.errors)) {
            result.valid = false;
        }
        
        return result;
    }
    
    /**
     * Method validation related section
     */
    
    public registerMethodParameterAssertion (
        TargetConstructor : Function,
        method : string | symbol,
        parameterIdx : number,
        rules : Rules,
        typeFn : () => Object,
        options : AssertionOptions
    )
    {
        this.initObject(TargetConstructor);
        
        const description = this.descriptions.get(TargetConstructor);
        if (!description.methods[method]) {
            description.methods[method] = {};
        }
        
        if (!description.methods[method][parameterIdx]) {
            description.methods[method][parameterIdx] = {
                rules: {},
                typeFn,
                options,
            };
        }
        
        merge(
            description.methods[method][parameterIdx].rules,
            rules
        );
    }
    
    
    public validateMethod (
        ClassConstructor : Function,
        method : string | symbol,
        parameters : any[]
    ) : ValidationResult
    {
        const ClassPrototype = ClassConstructor.prototype;
        const ParamTypes = Reflect.getMetadata('design:paramtypes', ClassPrototype, method);
        
        const result = new ValidationResult();
        
        const description = this.descriptions.get(ClassConstructor);
        if (!description) {
            return result;
        }
        
        const validatorRules : FunctionValidationConfig = description.methods[method];
        if (isEmpty(validatorRules)) {
            return result;
        }
        
        // validate each parameter
        for (const parameterIdx in validatorRules) {
            const { rules, typeFn, options } = validatorRules[parameterIdx];
            const value = parameters[parameterIdx];
            
            // determine param type
            let ParamType = ParamTypes[parameterIdx];
            
            if (typeFn) {
                ParamType = typeFn();
                if (ParamType instanceof Array) {
                    ParamType = ParamType[0];
                }
            }
            
            if (options.isArray) {
                if (!(value instanceof Array)) {
                    result.errors[parameterIdx] = [ { rule: 'type' } ];
                }
                else {
                    for (const [ idx, subValue ] of Object.entries(value)) {
                        const subPath = [ parameterIdx, idx ].join('.');
                        
                        const errors = this.validateSingle(
                            subValue,
                            ParamType,
                            { rules, options },
                            subPath
                        );
                        if (!isEmpty(errors)) {
                            result.errors = {
                                ...result.errors,
                                ...errors
                            };
                        }
                    }
                }
            }
            else {
                const errors = this.validateSingle(
                    value,
                    ParamType,
                    { rules, options },
                    parameterIdx
                );
                result.errors = {
                    ...result.errors,
                    ...errors
                };
            }
        }
        
        if (!isEmpty(result.errors)) {
            result.valid = false;
        }
        
        return result;
    }
    
    protected validateSingle(
        value : any,
        TypeClass : Function,
        { rules, options } : Partial<ParameterValidationDef>,
        basePath : string
    ): ValidationErrorMap
    {
        let errors : ValidationErrorMap = {};
        
        // validate type
        if (options.validateType) {
            const valid = this.validateType(value, TypeClass);
            if (!valid) {
                errors[basePath] = [ { rule: 'type' } ];
            }
        }
        
        // assertions validation
        const validateParameterResult = options.isComplex
            ? validateJsExt(value, rules, { format: 'intiv' })
            : validateJsExt({ field: value }, { field: rules }, { format: 'intiv' });
        
        if (!isEmpty(validateParameterResult)) {
            if (options.isComplex) {
                for (const [ field, _errors ] of Object.entries<any>(validateParameterResult)) {
                    const path = [ basePath, field ].join('.');
                    errors[path] = [
                        ...(errors[path] || []),
                        ..._errors
                    ];
                }
            }
            else {
                errors[basePath] = [
                    ...(errors[basePath] || []),
                    ...validateParameterResult.field
                ];
            }
        }
        
        // validate child
        if (
            !options.isComplex
            && this.shouldValidateChildByType(value, TypeClass)
        ) {
            const validateResult = this.validateObject(value, TypeClass, basePath);
            if (!validateResult.valid) {
                errors = {
                    ...errors,
                    ...validateResult.errors
                };
            }
        }
        
        return errors;
    }
    
    protected shouldValidateChildByType (
        value : any,
        TypeClass : Function
    ) : boolean
    {
        if ([ null, undefined ].includes(value)) {
            return false;
        }
        
        return ![ Object, Date, String, Boolean, Number ].includes(<any> TypeClass);
    }
    
}

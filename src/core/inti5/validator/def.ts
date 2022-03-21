export const ValidatorSymbol = Symbol('Validator');

export type ValidationError = {
    rule : string,
    options? : any[],
};

export type Rules = {
    date? : true,
    datetime? : {
        earliest? : Date | number | string,
        latest? : Date | number | string,
        dateOnly? : true,
    } | true,
    email? : true,
    equality? : string,
    exclusion? : any[],
    format? : string | RegExp,
    inclusion? : any[],
    length? : {
        is? : number,
        minimum? : number,
        maximum? : number,
    } | number,
    numericality? : {
        noStrings? : true,
        onlyInteger? : true,
        strict? : true,
        greaterThan? : number,
        greaterThanOrEqualTo? : number,
        equalTo? : number,
        lessThanOrEqualTo? : number,
        lessThan? : number,
        divisibleBy? : number,
        odd? : true,
        even? : true,
    } | true,
    presence? : {
        allowEmpty? : true,
    } | true,
    type? : 'array' | 'integer' | 'number' | 'string' | 'date' | 'boolean',
    url? : {
        schemes? : string[],
        allowLocal? : true,
        allowDataUrl? : true,
    } | true,
};

export type NestedRules<T> = Rules | {
    [name in keyof T]?: Rules
}

export type AssertionOptions = {
    validateType : boolean,
    isComplex : boolean,
    isArray: boolean,
};

export type ParameterValidationDef = {
    rules : NestedRules<any>,
    typeFn : () => Object,
    options: AssertionOptions,
};

export type FunctionValidationConfig = {
    [parameterIdx : number] : ParameterValidationDef
};

export type PropertyValidationDef = {
    rules : NestedRules<any>,
    typeFn : () => Object,
    options: AssertionOptions,
};

export type AssertObjectOptions = {
    allowUnspecifiedProperties? : boolean,
};

export type ValidationDescription = AssertObjectOptions & {
    properties : {
        [property : string|symbol] : PropertyValidationDef
    },
    methods : {
        [method : string|symbol] : FunctionValidationConfig
    }
};

export type ValidationErrorMap = {
    [path : string] : ValidationError[]
}

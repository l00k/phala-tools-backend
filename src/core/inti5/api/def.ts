import * as Trans from 'class-transformer';


export type TypeFn<T = any> = () => Trans.ClassConstructor<T>;

/**
 * Api config
 */
export const ID_APIKEY = '@id';
export const TYPE_APIKEY = '@type';

export enum ContextRole
{
    Public = 'public',
    Admin = 'admin',
    User = 'user',
    Owner = 'owner',
}

export type ApiConfig = {
    contextRoles : string[],
};


/**
 * Resources
 */
export type ResourceOptions = {
    path? : string,
    transform? : Trans.ClassTransformOptions
};
export type PropertyOptions = {
    id? : boolean,
    expose? : Trans.ExposeOptions,
    type? : boolean | Trans.TypeOptions,
    typeFn? : (type? : Trans.TypeHelpOptions) => any,
    transform? : Trans.TransformOptions,
    transformFn? : (params : Trans.TransformFnParams) => any,
};

export type PropertyDescription = {
    expose : Trans.ExposeOptions,
    type? : Trans.TypeOptions,
    typeFn? : (type? : Trans.TypeHelpOptions) => any,
    transform? : Trans.TransformOptions,
    transformFn? : (params : Trans.TransformFnParams) => any,
};
export type ResourceDescription = {
    name : string,
    path : string,
    idProperty : string,
    transformOptions : Trans.ClassTransformOptions,
    properties : {
        [property : string | symbol] : PropertyDescription
    }
};


/**
 * Serialization
 */
export type SerializationContext = {
    endpoint : string,
    roles? : string[],
    targetResourceType? : Function,
};

export enum SerializationAccessor
{
    Set = 'set',
    Get = 'get',
};
export type SerializationOptions = {
    transformOptions? : Trans.ClassTransformOptions,
}

export type SerializationProcessorOptions = {
    priority? : number,
};
export type DeserializationProcessorOptions = {
    priority? : number,
};

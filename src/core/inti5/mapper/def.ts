import { ClassConstructor, ClassTransformOptions } from 'class-transformer';


export const MapSymbol = Symbol('Mapping');


export type ParamMapOptions = {
    applyMapping : boolean,
    typeFn : () => ClassConstructor<any>,
    customMapping : Function,
    getterFn : Function,
    config? : ClassTransformOptions | any
};

export type MethodMapOptions = {
    customMapping : Function,
    config : ClassTransformOptions | any
    parameters : { [parameterIdx : number] : ParamMapOptions }
};

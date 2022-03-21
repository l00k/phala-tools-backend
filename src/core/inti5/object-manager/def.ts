export const InitializeSymbol = Symbol('Initialize');
export const ReleaseSymbol = Symbol('Release');


export interface ClassConstructor<T = any> extends Function  {
    new (...args : any[]) : T;
};

export type InjectableOptions = {
    tag? : string,
    key? : string,
    ctorArgs?: any[],
};

export class InjectionDescription
{

    public name? : string;
    public tag? : string;
    public ctorArgs : any[] = [];

    public constructor(
        public type : ClassConstructor<any>,
    )
    {}

}

export type InjectOptions = Partial<InjectionDescription>;

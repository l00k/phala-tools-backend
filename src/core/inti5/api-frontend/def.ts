import * as Def from '@inti5/api/def';

export * from '@inti5/api/def';

export interface ClassConstructor<T = any> extends Function  {
    new (...args : any[]) : T;
};

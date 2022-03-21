type NonFunctionPropertyNames<T> = NonNullable<{
    [K in keyof T] : T[K] extends Function ? never : K;
}[keyof T]>;

type Scalar = boolean | number | string | bigint | symbol | Date | RegExp | {
    toHexString () : string;
};

type ExpandScalar<T> = null | (T extends string ? string | RegExp : T extends Date ? Date | string : T);

type ExpandProperty<T> = T extends (infer U)[] ? NonNullable<U> : NonNullable<T>;
type FilterValue2<T> = T | ExpandScalar<T>;
type FilterValue = 'ASC' | 'DESC';
type ExpandObject<U> = {
    [K in NonFunctionPropertyNames<U>]? : ExpandObject<ExpandProperty<U[K]>> | FilterValue;
};

type Query<T> = T extends Scalar ? FilterValue : ExpandObject<T>;
export type Sorting<T> = ExpandObject<T>;

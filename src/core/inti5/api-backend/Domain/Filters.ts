type Primary<T> = T extends {
    _id : infer PK;
} ? PK | string : T extends {
    uuid : infer PK;
} ? PK : T extends {
    id : infer PK;
} ? PK : never;

type PrimaryProperty<T> = T extends {
    _id : any;
} ? '_id' | string : T extends {
    uuid : any;
} ? 'uuid' : T extends {
    id : any;
} ? 'id' : never;

type NonFunctionPropertyNames<T> = NonNullable<{
    [K in keyof T] : T[K] extends Function ? never : K;
}[keyof T]>;

type Scalar = boolean | number | string | bigint | symbol | Date | RegExp | {
    toHexString () : string;
};

type ExpandScalar<T> = null | (T extends string ? string | RegExp : T extends Date ? Date | string : T);

type OperatorMap<T> = {
    $not? : Filters<T>;
    $and? : Filters<T>[];
    $or? : Filters<T>[];
    
    $eq? : ExpandScalar<T>;
    $ne? : ExpandScalar<T>;
    $in? : ExpandScalar<T>[];
    $nin? : ExpandScalar<T>[];
    $gt? : ExpandScalar<T>;
    $gte? : ExpandScalar<T>;
    $lt? : ExpandScalar<T>;
    $lte? : ExpandScalar<T>;
    $like? : string;
    $re? : string;
    $ilike? : string;
    $overlap? : string[];
    $contains? : string[];
    $contained? : string[];
    
    [customSetter : string]: any;
};

type ExpandProperty<T> = T extends (infer U)[] ? NonNullable<U> : NonNullable<T>;
type FilterValue2<T> = T | ExpandScalar<T> | Primary<T>;
type FilterValue<T> = OperatorMap<FilterValue2<T>>;
type ExpandObject<U> = {
    [K in NonFunctionPropertyNames<U>]? : Query<ExpandProperty<U[K]>> | FilterValue<ExpandProperty<U[K]>>;
} | FilterValue<ExpandProperty<U>>;

type Query<T> = T extends Scalar ? FilterValue<T> : ExpandObject<T>;
export type Filters<T> = ExpandObject<T>;

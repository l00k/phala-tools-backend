import express from 'express';
import * as Def from '@inti5/api/def';

export * from '@inti5/api/def';


export interface ClassConstructor<T = any> extends Function {
    new (...args : any[]) : T;
};


export type RequestParameters = {
    [key : string | number] : RequestParameters | any,
};

export type ReqContext = {
    parameters: RequestParameters,
    request: express.Request,
    response: express.Response,
}

/**
 * Filterables
 */
export type FilterableDescription = {
    operators : FilterOperator[],
};

export type FilterOperator = string
    | '$eq'
    | '$ne'
    | '$gt'
    | '$gte'
    | '$lt'
    | '$lte'
    | '$in'
    | '$nin'
    | '$like'
    | '$re'
    | '$ilike'
    | '$overlap'
    | '$contains'
    | '$contained'
    ;

export type FilterNonArrayOperator = string
    | '$eq'
    | '$ne'
    | '$gt'
    | '$gte'
    | '$lt'
    | '$lte'
    | '$like'
    | '$re'
    | '$ilike'
    | '$overlap'
    | '$contains'
    | '$contained'
    ;

export type FilterArrayOperator = string
    | '$in'
    | '$nin'
    ;

export type LogicalOperator = string
    | '$and'
    | '$or'
    | '$not'
    ;


export const FILTER_OPERATORS : (FilterOperator | LogicalOperator)[] = [
    '$eq', '$ne',
    '$gt', '$gte', '$lt', '$lte',
    '$in', '$nin',
    '$like',
    '$re', '$ilike', '$overlap', '$contains', '$contained',
    '$and', '$or', '$not'
];

export const LOGICAL_OPERATORS : LogicalOperator[] = [ '$and', '$or', '$not' ];
export const ARRAY_OPERATORS : (FilterOperator | LogicalOperator)[] = [ '$and', '$or', '$in', '$nin' ];

export const DEFAULT_FILTERS : FilterOperator[] = [ '$eq', '$ne', '$in', '$nin' ];
export const BOOLEAN_DEFAULT_FILTERS : FilterOperator[] = [ '$eq', '$ne', '$in', '$nin' ];
export const NUMBER_DEFAULT_FILTERS : FilterOperator[] = [ '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin' ];
export const STRING_DEFAULT_FILTERS : FilterOperator[] = [ '$eq', '$ne', '$like', '$in', '$nin', '$ilike', '$overlap', '$contains', '$contained' ];
export const DATE_DEFAULT_FILTERS : FilterOperator[] = [ '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin' ];


/**
 * Sortable
 */
export type SortingOperator = 'ASC' | 'DESC';

export type SortableDescription = {
    operators : SortingOperator[],
};

import express from 'express';

export type RequestMethod = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';

export type RouteDescription = {
    requestMethod : RequestMethod,
    contentType : string,
    path : string,
    actionMethod : string | symbol,
    middlewares : express.RequestHandler[]
};

export type ControllerDescription = {
    baseRoute : Partial<RouteDescription>,
    actions : {
        [method : string | symbol] : RouteDescription
    }
};

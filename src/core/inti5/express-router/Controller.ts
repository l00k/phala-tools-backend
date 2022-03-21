import express from 'express';

export abstract class Controller
{
    
    public async beforeHandle(request : express.Request, response : express.Response) : Promise<any>
    {
    }
    
}

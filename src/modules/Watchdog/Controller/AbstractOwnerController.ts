import { CrudController } from '#/BackendCore/Controller/CrudController';
import { User } from '#/Watchdog/Domain/Model/User';
import { EntityRepository } from '@mikro-orm/core';
import { ValidationException } from '@inti5/validator';
import express from 'express';


export abstract class AbstractOwnerController<T>
    extends CrudController<T>
{
    
    protected _userRepository : EntityRepository<User>;
    
    
    public async beforeHandle (
        request : express.Request,
        response : express.Response
    ) : Promise<any>
    {
        super.beforeHandle(request, response);
        this._userRepository = this._entityManager.getRepository(User);
    }
    
    protected async _verifyOwnership (
        owner : User,
        authData : any
    ) : Promise<void>
    {
        if (owner.id !== authData.userId) {
            throw new ValidationException('Ownership verificaiton failed', 1649520720489);
        }
    }
    
}

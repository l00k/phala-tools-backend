import { AbstractOwnerController } from '#/Watchdog/Controller/AbstractOwnerController';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { User } from '#/Watchdog/Domain/Model/User';
import { API } from '@inti5/api-backend';
import * as Router from '@inti5/express-router';
import { EntitySanitizationGraph } from '@inti5/graph-sanitizer';
import { Type } from '@inti5/graph-typing';
import { Assert, ValidationException } from '@inti5/validator/Method';


const observationSanitizationGraph : EntitySanitizationGraph<Observation> = {
    stakePool: {
        onChainId: true,
        owner: '*',
    },
    account: '*',
    mode: true,
    config: '**',
    lastNotifications: '*',
};


export class ObservationController
    extends AbstractOwnerController<Observation>
{
    
    protected static readonly ENTITY = Observation;
    
    
    @API.CRUD.Create(() => Observation)
    @API.Serialize(observationSanitizationGraph)
    @Router.AuthOnly()
    @Type(() => Observation)
    public async create (
        @Router.AuthData()
            authData : any,
        @Router.Body()
        @API.Deserialize<Observation>({
            stakePool: true,
            account: true,
            mode: true,
            config: '**',
            lastNotifications: false,
        })
        @Assert()
            observation : Observation
    ) : Promise<Observation>
    {
        const user : User = await this._userRepository.findOne(authData.userId);
        await user.observations.loadItems();
        
        // limit
        const perUserLimit = User.MAX_OBSERVATION_COUNT;
        if (user.observations.length > perUserLimit) {
            throw new ValidationException(
                `Observation count exceed limit (${perUserLimit})`,
                1649911666498
            );
        }
        
        // assign owner
        observation.user = user;
        
        await this._entityManager.persistAndFlush(observation);
        return observation;
    }
    
    @API.CRUD.Update(() => Observation)
    @API.Serialize(observationSanitizationGraph)
    @Router.AuthOnly()
    @Type(() => Observation)
    public async update (
        @Router.AuthData()
            authData : any,
        @Router.Param.Id()
            id : number,
        @Router.Body()
        @API.Deserialize<Observation>({
            stakePool: true,
            account: true,
            mode: true,
            config: '**',
            lastNotifications: false,
        })
        @Assert()
            observationUpdate : Observation
    ) : Promise<Observation>
    {
        const observation = await this._repository.findOne(id);
        if (!observation) {
            throw new ValidationException('Entity not exist', 1649806927410);
        }
        
        // verify ownership
        await this._verifyOwnership(observation.user, authData);
        
        observation.assign(observationUpdate);
        
        await this._entityManager.persistAndFlush(observation);
        return observation;
    }
    
    @API.CRUD.Delete(() => Observation)
    @API.Serialize(true)
    @Router.AuthOnly()
    @Type(() => Boolean)
    public async delete (
        @Router.AuthData()
            authData : any,
        @Router.Param.Id()
            id : number
    ) : Promise<boolean>
    {
        // load
        const observation = await this._repository.findOne(id);
        if (!observation) {
            throw new ValidationException('Entity not exist', 1649911734566);
        }
        
        // verify ownership
        await this._verifyOwnership(observation.user, authData);
        
        // delete
        try {
            await this._repository.removeAndFlush(observation);
        }
        catch (e) {
            return false;
        }
        
        return true;
    }
    
}

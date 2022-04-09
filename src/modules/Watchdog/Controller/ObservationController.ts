import { AbstractOwnerController } from '#/Watchdog/Controller/AbstractOwnerController';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { Annotation as API } from '@inti5/api-backend';
import * as Router from '@inti5/express-ext';
import { RuntimeException } from '@inti5/utils/Exception';
import { Assert } from '@inti5/validator/Method';
import { EntitySerializationGraph } from 'core/serializer';


const observationSanitizationGraph : EntitySerializationGraph<Observation> = {
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
    @API.Serialize(observationSanitizationGraph, () => Observation)
    @Router.AuthOnly()
    public async create (
        @Router.AuthData()
            authData : any,
        @Router.Body()
        @API.Deserialize({
            stakePool: true,
            account: true,
            mode: true,
            config: '**',
            lastNotifications: false,
        }, () => Observation)
        @Assert()
            observation : Observation
    ) : Promise<Observation>
    {
        // assign owner
        observation.user = await this._userRepository.findOne(authData.userId);
        
        await this._entityManager.persistAndFlush(observation);
        return observation;
    }
    
    @API.CRUD.Update(() => Observation)
    @API.Serialize(observationSanitizationGraph, () => Observation)
    @Router.AuthOnly()
    public async update (
        @Router.AuthData()
            authData : any,
        @Router.Param.Id()
            id : number,
        @Router.Body()
        @API.Deserialize({
            stakePool: true,
            account: true,
            mode: true,
            config: '**',
            lastNotifications: false,
        }, () => Observation)
        @Assert()
            observationUpdate : Observation
    ) : Promise<Observation>
    {
        const observation = await this._repository.findOne(id);
        
        // verify ownership
        await this._verifyOwnership(observation.user, authData);
        
        observation.assign(observationUpdate);
        
        await this._entityManager.persistAndFlush(observation);
        return observation;
    }
    
    @API.CRUD.Delete(() => Observation)
    @Router.AuthOnly()
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
            throw new RuntimeException('Item not found', 1649519212197);
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

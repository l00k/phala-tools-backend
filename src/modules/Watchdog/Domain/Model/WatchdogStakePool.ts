import * as Phala from '#/Phala/Domain/Model';
import { WatchdogAccount } from '#/Watchdog/Domain/Model/WatchdogAccount';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


@ORM.Entity()
@API.Resource('Watchdog/StakePool')
export class WatchdogStakePool
    extends Phala.StakePool
{
    
    
    @API.Id()
    @API.Groups([
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    public id : number;
    
    
    @API.Property()
    @API.Groups([
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    @API.Filterable()
    public onChainId : number;
    
    @API.Property(() => Phala.Account)
    @API.Groups([
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    @API.Filterable()
    public owner : Phala.Account;
    
    
    public constructor (data? : Partial<WatchdogStakePool>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

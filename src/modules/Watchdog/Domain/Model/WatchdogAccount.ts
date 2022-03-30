import * as Phala from '#/Phala/Domain/Model';
import { Annotation as API } from '@inti5/api-backend';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';


@ORM.Entity()
@API.Resource('Watchdog/Account')
export class WatchdogAccount
    extends Phala.Account
{
    
    @API.Id()
    @API.Groups([
        'Watchdog/Account',
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    public id : number;
    
    
    @API.Property()
    @API.Groups([
        'Watchdog/Account',
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    @API.Filterable()
    public address : string;
    
    @API.Property()
    @API.Groups([
        'Watchdog/Account',
        'Watchdog/StakePool/Collection',
        'Watchdog/StakePool',
        'Watchdog/User',
    ])
    @API.Filterable()
    public identity : string;
    
    
    public constructor (data? : Partial<WatchdogAccount>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

import * as Polkadot from '#/Polkadot';
import { Config } from '@inti5/configuration';
import { Inject, Singleton } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { khala as Khala } from '@phala/typedefs';
import { ApiPromise } from '@polkadot/api';



@Singleton()
export class ApiProvider
    extends Polkadot.ApiProvider
{
    
    protected static readonly SERVICE_NAME : string = 'PhalaApiProvider';
    
    
    @Config('module.phala.api.wsUrl')
    protected apiWsUrl : string = null;
    
    
    @Inject({ ctorArgs: [ ApiProvider.SERVICE_NAME ] })
    protected logger : Logger = null;
    
    
    protected createApi () : Promise<ApiPromise>
    {
        return ApiPromise.create({
            provider: this.wsProvider,
            types: Khala,
        });
    }
    
}
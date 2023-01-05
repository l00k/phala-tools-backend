import * as Polkadot from '#/Polkadot';
import { Config } from '@inti5/configuration';
import { Inject, Singleton } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { khala as KhalaTypes } from '@phala/typedefs';
import { ApiPromise } from '@polkadot/api';
import { ProviderInterface } from '@polkadot/rpc-provider/types';

@Singleton()
export class ApiProvider
    extends Polkadot.ApiProvider
{
    
    protected static readonly SERVICE_NAME : string = 'PhalaApiProvider';
    
    
    @Config('modules.phala.api.urls')
    protected _apiUrls : Polkadot.ApiModeMap<string> = {};
    
    @Inject({ ctorArgs: [ ApiProvider.SERVICE_NAME ] })
    protected _logger : Logger = null;
    
    
    protected _createApi (provider : ProviderInterface) : Promise<ApiPromise>
    {
        const typedefs = require('@phala/typedefs').khala;
        
        return ApiPromise.create({
            provider,
            types: {
                ...KhalaTypes,
                NftAttr: {
                    shares: 'Balance',
                }
            }
        });
    }
    
}

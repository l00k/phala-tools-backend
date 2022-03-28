import { Config } from '@inti5/configuration';
import { Inject, ReleaseSymbol, Singleton } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { ApiPromise, HttpProvider, WsProvider } from '@polkadot/api';
import { ProviderInterface } from '@polkadot/rpc-provider/types';


export enum ApiMode
{
    WS = 'WS',
    HTTP = 'HTTP',
}

export type ApiModeMap<T> = {
    [mode : string] : T
}


@Singleton()
export class ApiProvider
{
    
    protected static readonly SERVICE_NAME : string = 'PolkadotApiProvider';
    
    
    @Config('module.polkadot.api.urls')
    protected _apiUrls : ApiModeMap<string>;
    
    @Inject({ ctorArgs: [ ApiProvider.SERVICE_NAME ] })
    protected _logger : Logger;
    
    protected _apiPromise : ApiModeMap<Promise<ApiPromise>> = {};
    protected _api : ApiModeMap<ApiPromise> = {};
    
    
    public async getApi (apiMode : ApiMode = ApiMode.HTTP) : Promise<ApiPromise>
    {
        if (!this._apiPromise[apiMode]) {
            this._apiPromise[apiMode] = this._createApiPromise(apiMode);
        }
        
        if (!this._api[apiMode]) {
            this._api[apiMode] = await this._apiPromise[apiMode];
        }
        
        return this._api[apiMode];
    }
    
    public async [ReleaseSymbol] ()
    {
        if (this._apiPromise[ApiMode.WS]) {
            await this._apiPromise[ApiMode.WS];
        
            if (this._api[ApiMode.WS].isConnected) {
                await this._api[ApiMode.WS].disconnect();
                delete this._api[ApiMode.WS];
            }
            
            delete this._apiPromise[ApiMode.WS];
        }
    }
    
    protected _createApiPromise (apiMode : ApiMode) : Promise<ApiPromise>
    {
        let provider = null;
        
        if (apiMode == ApiMode.WS) {
            provider = new WsProvider(this._apiUrls[ApiMode.WS]);
            
            provider.on('connected', () => {
                this._logger.log('Connected to node.');
            });
            provider.on('disconnected', () => {
                this._logger.log('Disconnected from node.');
            });
        }
        else {
            provider = new HttpProvider(this._apiUrls[ApiMode.HTTP]);
        }
        
        return this._createApi(provider);
    }
    
    protected _createApi (provider : ProviderInterface) : Promise<ApiPromise>
    {
        return ApiPromise.create({ provider });
    }
    
    protected _isWsUrl (url : string) : boolean
    {
        return !!url.match(/^ws[s]?:/);
    }
    
}

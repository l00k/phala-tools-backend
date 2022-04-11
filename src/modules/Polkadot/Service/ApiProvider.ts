import { Config } from '@inti5/configuration';
import { Inject, ReleaseSymbol, Singleton } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { Timeout } from '@inti5/utils/Timeout';
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
    
    
    @Config('modules.polkadot.api.urls')
    protected _apiUrls : ApiModeMap<string>;
    
    @Inject({ ctorArgs: [ ApiProvider.SERVICE_NAME ] })
    protected _logger : Logger;
    
    protected _api : ApiModeMap<ApiPromise> = {};
    
    
    @Timeout(15000)
    public async getApi (apiMode : ApiMode = ApiMode.HTTP) : Promise<ApiPromise>
    {
        if (!this._api[apiMode]) {
            this._logger.log('Creating api promise', apiMode);
            this._api[apiMode] = this._createApiPromise(apiMode);
        }
        
        const api = this._api[apiMode];
        
        // wait until is ready
        await api.isReady;
        
        return api;
    }
    
    public async [ReleaseSymbol] ()
    {
        if (this._api[ApiMode.WS]) {
            if (this._api[ApiMode.WS].isConnected) {
                await this._api[ApiMode.WS].disconnect();
                delete this._api[ApiMode.WS];
            }
            
            delete this._api[ApiMode.WS];
        }
    }
    
    protected _createApiPromise (apiMode : ApiMode) : ApiPromise
    {
        const url = this._apiUrls[apiMode];
        
        let provider = null;
        if (apiMode == ApiMode.WS) {
            provider = new WsProvider(url);
            
            provider.on('connected', () => {
                this._logger.log('Connected to node.');
            });
            provider.on('disconnected', () => {
                this._logger.log('Disconnected from node.');
            });
        }
        else {
            provider = new HttpProvider(url);
        }
        
        return this._createApi(provider);
    }
    
    protected _createApi (provider : ProviderInterface) : ApiPromise
    {
        return new ApiPromise({ provider });
    }
    
    protected _isWsUrl (url : string) : boolean
    {
        return !!url.match(/^ws[s]?:/);
    }
    
}

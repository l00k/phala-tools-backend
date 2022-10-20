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
    
    protected _apiPromise : ApiModeMap<Promise<ApiPromise>> = {};
    protected _api : ApiModeMap<ApiPromise> = {};
    
    
    @Timeout(30000)
    public async getApi (apiMode : ApiMode = ApiMode.HTTP) : Promise<ApiPromise>
    {
        if (!this._apiPromise[apiMode]) {
            this._logger.log('Creating api promise', apiMode);
            this._apiPromise[apiMode] = this._createApiPromise(apiMode);
        }
        
        if (!this._api[apiMode]) {
            this._logger.log('Creating api', apiMode);
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
    
    protected async _createApiPromise (apiMode : ApiMode) : Promise<ApiPromise>
    {
        const url = this._apiUrls[apiMode];
        
        let provider = null;
        if (apiMode == ApiMode.WS) {
            provider = new WsProvider(url);
            
            provider.on('connected', () => {
                this._logger.log('Connected to node:', url);
            });
            provider.on('disconnected', () => {
                this._logger.log('Disconnected from node.');
            });
        }
        else {
            this._logger.log('Http node:', url);
            provider = new HttpProvider(url);
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

import { InitializeSymbol, Inject, ReleaseSymbol, Singleton } from '@inti5/object-manager';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Config } from '@inti5/configuration';
import { Logger } from '@inti5/utils/Logger';


@Singleton()
export class ApiProvider
{
    
    protected static readonly SERVICE_NAME : string = 'PolkadotApiProvider';
    
    
    @Config('module.polkadot.api.wsUrl')
    protected _apiWsUrl : string;
    
    
    @Inject({ ctorArgs: [ApiProvider.SERVICE_NAME] })
    protected _logger : Logger;
    
    protected _wsProvider : WsProvider;
    
    protected _apiPromise : Promise<ApiPromise>;
    
    #api : ApiPromise;
    
    
    public async getApi () : Promise<ApiPromise>
    {
        await this._apiPromise;
        return this.#api;
    }
    
    public [InitializeSymbol] ()
    {
        this._wsProvider = new WsProvider(this._apiWsUrl);
        
        this._wsProvider.on('connected', () => {
            this._logger.log('Connected to node.');
        });
        this._wsProvider.on('disconnected', () => {
            this._logger.log('Disconnected from node.');
        });
        
        this._apiPromise = this._createApi();
        this._apiPromise.then(api => this.#api = api);
    }
    
    public async [ReleaseSymbol] ()
    {
        if (this.#api && this.#api.isConnected) {
            await this.#api.disconnect();
        }
    }
    
    protected _createApi () : Promise<ApiPromise>
    {
        return ApiPromise.create({ provider: this._wsProvider });
    }
    
}

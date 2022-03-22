import { InitializeSymbol, Inject, ReleaseSymbol, Singleton } from '@inti5/object-manager';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Config } from '@inti5/configuration';
import { Logger } from '@inti5/utils/Logger';


@Singleton()
export class ApiProvider
{
    
    protected static readonly SERVICE_NAME : string = 'PolkadotApiProvider';
    
    
    @Config('module.polkadot.api.wsUrl')
    protected apiWsUrl : string;
    
    
    @Inject({ ctorArgs: [ApiProvider.SERVICE_NAME] })
    protected logger : Logger;
    
    protected wsProvider : WsProvider;
    
    protected apiPromise : Promise<ApiPromise>;
    
    #api : ApiPromise;
    
    
    public async getApi () : Promise<ApiPromise>
    {
        await this.apiPromise;
        return this.#api;
    }
    
    public [InitializeSymbol] ()
    {
        this.wsProvider = new WsProvider(this.apiWsUrl);
        
        this.wsProvider.on('connected', () => {
            this.logger.log('Connected to node.');
        });
        this.wsProvider.on('disconnected', () => {
            this.logger.log('Disconnected from node.');
        });
        
        this.apiPromise = this.createApi();
        this.apiPromise.then(api => this.#api = api);
    }
    
    public async [ReleaseSymbol] ()
    {
        if (this.#api && this.#api.isConnected) {
            await this.#api.disconnect();
        }
    }
    
    protected createApi () : Promise<ApiPromise>
    {
        return ApiPromise.create({ provider: this.wsProvider });
    }
    
}

import * as Polkadot from '#/Polkadot';
import { Config } from '@inti5/configuration';
import { Inject, Singleton } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';



@Singleton()
export class Subscan
    extends Polkadot.Subscan
{
    
    protected static readonly SERVICE_NAME : string = 'PhalaSubscan';
    
    @Config('module.phala.subscan.baseUrl')
    protected _subscanBaseUrl : string = null;
    
    @Inject({ ctorArgs: [ Subscan.SERVICE_NAME ] })
    protected _logger : Logger = null;
    
}

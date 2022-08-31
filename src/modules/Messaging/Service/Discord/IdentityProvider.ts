import { DiscordConfig } from '#/Messaging/Domain/types';
import { REST } from '@discordjs/rest';
import { Config } from '@inti5/configuration';
import { InitializeSymbol } from '@inti5/object-manager';
import type { APIUser, RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v9';
import { Routes } from 'discord-api-types/v9';


export class IdentityProvider
{
    
    @Config('modules.messaging.discord')
    protected _config : DiscordConfig;
    
    
    protected _botRest : REST;
    
    
    public [InitializeSymbol] ()
    {
        this._botRest = new REST({ version: '10' });
        this._botRest.setToken(this._config.botToken);
    }
    
    
    public async getAccessTokenViaCode (code : string) : Promise<RESTPostOAuth2AccessTokenResult>
    {
        return <any>await this._botRest.post(
            Routes.oauth2TokenExchange(),
            {
                passThroughBody: true,
                body: new URLSearchParams({
                    client_id: this._config.clientId,
                    client_secret: this._config.clientSecret,
                    code,
                    redirect_uri: this._config.redirectUri,
                    grant_type: 'authorization_code',
                    scope: 'identify',
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
    }
    
    public async getIdentity (accessToken : string) : Promise<APIUser>
    {
        const userRest = new REST({ version: '9' });
        userRest.setToken(accessToken);
        
        return <any>await userRest.get(
            Routes.user(),
            {
                authPrefix: 'Bearer'
            }
        );
    }
    
}

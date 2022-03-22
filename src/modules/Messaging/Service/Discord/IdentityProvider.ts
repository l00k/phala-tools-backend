import { DiscordConfig } from '#/Messaging/Domain/types';
import { REST } from '@discordjs/rest';
import { Config } from '@inti5/configuration';
import { InitializeSymbol } from '@inti5/object-manager';
import { APIUser, RESTPostOAuth2AccessTokenResult } from 'discord-api-types';
import { Routes } from 'discord-api-types/v9';


export class IdentityProvider
{
    
    @Config('module.messaging.discord')
    protected config : DiscordConfig;
    
    
    protected botRest : REST;
    
    
    public [InitializeSymbol] ()
    {
        this.botRest = new REST({ version: '10' });
        this.botRest.setToken(this.config.botToken);
    }
    
    
    public async getAccessTokenViaCode (code : string) : Promise<RESTPostOAuth2AccessTokenResult>
    {
        return <any>await this.botRest.post(
            Routes.oauth2TokenExchange(),
            {
                passThroughBody: true,
                body: new URLSearchParams({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    code,
                    redirect_uri: this.config.redirectUri,
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

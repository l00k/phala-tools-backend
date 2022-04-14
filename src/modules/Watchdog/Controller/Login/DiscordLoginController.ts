import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { JwtSigner } from '#/BackendCore/Service/JwtSigner';
import { MessagingChannel } from '#/Messaging/Domain/MessagingChannel';
import { IdentityProvider as DiscordIdentityProvider } from '#/Messaging/Service/Discord/IdentityProvider';
import { DiscordLoginDto } from '#/Watchdog/Controller/Login/Dto/DiscordLoginDto';
import { User } from '#/Watchdog/Domain/Model/User';
import { Body, Controller, Endpoint } from '@inti5/express-ext';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { Assert, Validate } from '@inti5/validator/Method';
import { APIUser } from 'discord-api-types';


export class DiscordLoginController
    extends Controller
{
    
    @Inject({ ctorArgs: [ DiscordLoginController.name ] })
    protected _logger : Logger;
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _jwtSigner : JwtSigner;
    
    @Inject()
    protected _discordIdentityProvider : DiscordIdentityProvider;
    
    
    @Endpoint.POST('/login/discord')
    @Validate()
    public async index (
        @Body()
        @Assert({ presence: true })
            body : DiscordLoginDto
    )
    {
        try {
            const discordAccessToken = await this._discordIdentityProvider.getAccessTokenViaCode(body.code);
            const identity = await this._discordIdentityProvider.getIdentity(discordAccessToken.access_token);
            const user = await this._getOrCreateUser(identity);
            
            return this._jwtSigner.createTokens({
                userId: user.id,
            });
        }
        catch (e) {
            console.error(e);
            return false;
        }
    }
    
    protected async _getOrCreateUser (apiUser : APIUser) : Promise<User>
    {
        const entityManager = this._entityManagerWrapper.getCommonEntityManager();
        const userRepository = entityManager.getRepository(User);
        
        let user = await userRepository.findOne({
            msgChannel: MessagingChannel.Discord,
            msgUserId: apiUser.id,
        });
        if (!user) {
            user = new User({
                msgChannel: MessagingChannel.Discord,
                msgUserId: apiUser.id,
                username: `${apiUser.username}#${apiUser.discriminator}`
            }, entityManager);
            
            await entityManager.persistAndFlush(user);
        }
        
        return user;
    }
    
}

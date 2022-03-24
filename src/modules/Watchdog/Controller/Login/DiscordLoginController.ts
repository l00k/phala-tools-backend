import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { JwtSigner } from '#/BackendCore/Service/JwtSigner';
import { IdentityProvider as DiscordIdentityProvider } from '#/Messaging/Service/Discord/IdentityProvider';
import { MessagingChannel } from '#/Messaging/Service/MessagingProvider';
import { DiscordLoginDto } from '#/Watchdog/Controller/Login/DiscordLoginDto';
import { User } from '#/Watchdog/Domain/Model/User';
import { Body, Controller, Endpoint } from '@inti5/express-ext';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { Assert } from '@inti5/validator/Method';
import { APIUser } from 'discord-api-types';
import rateLimit from 'express-rate-limit';


export class DiscordLoginController
    extends Controller
{
    
    @Inject({ ctorArgs: [ DiscordLoginController.name ] })
    protected logger : Logger;
    
    @Inject()
    protected entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected jwtSigner : JwtSigner;
    
    @Inject()
    protected discordIdentityProvider : DiscordIdentityProvider;
    
    
    @Endpoint.POST('/login/discord', {
        middlewares: [
            rateLimit({ windowMs: 15 * 1000, max: 1 })
        ]
    })
    public async index (
        @Body()
        @Assert({ presence: true })
            body : DiscordLoginDto
    )
    {
        try {
            const discordAccessToken = await this.discordIdentityProvider.getAccessTokenViaCode(body.code);
            const identity = await this.discordIdentityProvider.getIdentity(discordAccessToken.access_token);
            const user = await this.getOrCreateUser(identity);
            
            return this.jwtSigner.createTokens({
                userId: user.id,
            });
        }
        catch (e) {
            return false;
        }
    }
    
    protected async getOrCreateUser (apiUser : APIUser) : Promise<User>
    {
        const entityManager = this.entityManagerWrapper.getDirectEntityManager();
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

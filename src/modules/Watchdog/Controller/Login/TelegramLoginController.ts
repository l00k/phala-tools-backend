import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { JwtSigner } from '#/BackendCore/Service/JwtSigner';
import { TelegramConfig } from '#/Messaging/Domain/types';
import { MessagingChannel } from '#/Messaging/Service/MessagingProvider';
import { TelegramLoginDto } from '#/Watchdog/Controller/Login/TelegramLoginDto';
import { User } from '#/Watchdog/Domain/Model/User';
import { Body, Controller, Endpoint } from '@inti5/express-ext';
import { Inject } from '@inti5/object-manager';
import { Assert } from '@inti5/validator/Method';
import { Config } from 'core/configuration';
import { Logger } from 'core/utils/Logger';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';


export class TelegramLoginController
    extends Controller
{
    
    @Inject({ ctorArgs: [ TelegramLoginController.name ] })
    protected logger : Logger;
    
    @Inject()
    protected entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected jwtSigner : JwtSigner;
    
    @Config('module.messaging.telegram')
    protected telegramConfig : TelegramConfig;
    
    
    @Endpoint.POST('/login/telegram', {
        middlewares: [
            rateLimit({ windowMs: 15 * 1000, max: 1 })
        ]
    })
    public async index (
        @Body()
        @Assert({ presence: true })
            body : TelegramLoginDto
    )
    {
        try {
            const verified = this.verifyTelegramLogin(body);
            if (!verified) {
                return false;
            }
            
            const user = await this.getOrCreateUser(body);
            
            return this.jwtSigner.createTokens({
                userId: user.id,
            });
        }
        catch (e) {
            return false;
        }
    }
    
    protected async verifyTelegramLogin (telegramUser : TelegramLoginDto)
    {
        const fields = [ 'auth_date', 'first_name', 'id', 'last_name', 'photo_url', 'username', ];
        const text = fields
            .map(field => `${field}=${telegramUser[field]}`)
            .join('\n');
        
        const secretKey = crypto.createHash('sha256')
            .update(this.telegramConfig.botToken)
            .digest('hex');
        
        const hmac = crypto.createHmac('sha256', secretKey)
            .update(text)
            .digest('hex');
        
        return hmac === telegramUser.hash;
    }
    
    protected async getOrCreateUser (telegramUser : TelegramLoginDto) : Promise<User>
    {
        const entityManager = this.entityManagerWrapper.getDirectEntityManager();
        const userRepository = entityManager.getRepository(User);
        
        let user = await userRepository.findOne({
            msgChannel: MessagingChannel.Telegram,
            msgUserId: telegramUser.id,
        });
        if (!user) {
            user = new User({
                msgChannel: MessagingChannel.Telegram,
                msgUserId: telegramUser.id,
                username: telegramUser.username,
            }, entityManager);
            
            await entityManager.persistAndFlush(user);
        }
        
        return user;
    }
    
    
}

import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { JwtSigner } from '#/BackendCore/Service/JwtSigner';
import { TelegramConfig } from '#/Messaging/Domain/types';
import { MessagingChannel } from '#/Messaging/Domain/MessagingChannel';
import { TelegramLoginDto } from '#/Watchdog/Controller/Login/Dto/TelegramLoginDto';
import { User } from '#/Watchdog/Domain/Model/User';
import { Body, Controller, Endpoint } from '@inti5/express-ext';
import { Inject } from '@inti5/object-manager';
import { Assert, Validate } from '@inti5/validator/Method';
import { Config } from '@inti5/configuration';
import { Logger } from '@inti5/utils/Logger';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';


export class TelegramLoginController
    extends Controller
{
    
    @Inject({ ctorArgs: [ TelegramLoginController.name ] })
    protected _logger : Logger;
    
    @Inject()
    protected _entityManagerWrapper : EntityManagerWrapper;
    
    @Inject()
    protected _jwtSigner : JwtSigner;
    
    @Config('modules.messaging.telegram')
    protected _telegramConfig : TelegramConfig;
    
    
    @Endpoint.POST('/login/telegram')
    @Validate()
    public async index (
        @Body()
        @Assert({ presence: true })
            body : TelegramLoginDto
    )
    {
        try {
            const verified = this._verifyTelegramLogin(body);
            if (!verified) {
                return false;
            }
            
            const user = await this._getOrCreateUser(body);
            
            return this._jwtSigner.createTokens({
                userId: user.id,
            });
        }
        catch (e) {
            return false;
        }
    }
    
    protected async _verifyTelegramLogin (telegramUser : TelegramLoginDto)
    {
        const fields = Object.keys(telegramUser)
            .filter(field => [ 'hash' ].includes(field))
            .sort();
        const text = fields
            .map(field => `${field}=${telegramUser[field]}`)
            .join('\n');
        
        const secretKey = crypto.createHash('sha256')
            .update(this._telegramConfig.botToken)
            .digest('hex');
        
        const hmac = crypto.createHmac('sha256', secretKey)
            .update(text)
            .digest('hex');
        
        return hmac === telegramUser.hash;
    }
    
    protected async _getOrCreateUser (telegramUser : TelegramLoginDto) : Promise<User>
    {
        const entityManager = this._entityManagerWrapper.getCommonEntityManager();
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

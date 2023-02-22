import { EntityManagerWrapper } from '#/BackendCore/Service/EntityManagerWrapper';
import { JwtSigner } from '#/BackendCore/Service/JwtSigner';
import { MessagingChannel } from '#/Messaging/Domain/MessagingChannel';
import { TelegramConfig } from '#/Messaging/Domain/types';
import { TelegramLoginDto } from '#/Watchdog/Controller/Login/Dto/TelegramLoginDto';
import { User } from '#/Watchdog/Domain/Model/User';
import { Config } from '@inti5/configuration';
import { Body, Controller, Endpoint } from '@inti5/express-router';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import { Assert, Validate } from '@inti5/validator/Method';
import crypto from 'crypto';


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
    
    
    protected static FIELDS_MAP : Record<string, string> = {
        auth_date: 'authDate',
        first_name: 'firstName',
        id: 'id',
        last_name: 'lastName',
        photo_url: 'photoUrl',
        username: 'username'
    };
    
    
    @Endpoint.POST('/login/telegram')
    @Validate()
    public async index (
        @Body()
        @Assert({ presence: true })
            body : TelegramLoginDto
    )
    {
        try {
            const verified = await this._verifyTelegramLogin(body);
            console.log('verified', verified);
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
        const text = Object.entries(TelegramLoginController.FIELDS_MAP)
            .filter(([ targetField, srcField ]) => !!telegramUser[srcField])
            .map(([ targetField, srcField ]) => `${targetField}=${telegramUser[srcField]}`)
            .join('\n');
        
        const secretKey = crypto.createHash('sha256')
            .update(this._telegramConfig.botToken)
            .digest();
        
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
            msgUserId: telegramUser.id.toString(),
        });
        if (!user) {
            user = new User({
                msgChannel: MessagingChannel.Telegram,
                msgUserId: telegramUser.id.toString(),
                username: telegramUser.username,
            }, entityManager);
            
            await entityManager.persistAndFlush(user);
        }
        
        return user;
    }
    
    
}

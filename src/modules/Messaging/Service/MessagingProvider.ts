import { MessagingChannel } from '#/Messaging/Domain/MessagingChannel';
import { DiscordConfig, TelegramConfig } from '#/Messaging/Domain/types';
import { REST } from '@discordjs/rest';
import { Config } from '@inti5/configuration';
import { InitializeSymbol, Singleton } from '@inti5/object-manager';
import { Routes } from 'discord-api-types/v9';
import { Message, PartialGroupDMChannel } from 'discord.js';
import { Telegram, } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';


@Singleton()
export class MessagingProvider
{
    
    @Config('modules.messaging.discord')
    protected _discordConfig : DiscordConfig;
    
    @Config('modules.messaging.telegram')
    protected _telegramConfig : TelegramConfig;
    
    
    protected _discordRest : REST;
    
    protected _telegram : Telegram;
    
    
    public [InitializeSymbol] ()
    {
        this._discordRest = new REST({ version: '10' });
        this._discordRest.setToken(this._discordConfig.botToken);
        
        this._telegram = new Telegram(this._telegramConfig.botToken);
    }
    
    
    public async sendMessage (
        channel : MessagingChannel,
        chatId : string,
        text : string
    ) : Promise<any>
    {
        if (channel == MessagingChannel.Discord) {
            return this._sendMessageViaDiscord(chatId, text);
        }
        else if (channel == MessagingChannel.Telegram) {
            return this._sendMessageViaTelegram(chatId, text);
        }
        
        return null;
    }
    
    protected async _sendMessageViaDiscord (
        chatId : string,
        text : string
    ) : Promise<Message>
    {
        if (this._discordConfig.redirectMsgTo) {
            text = `## Redirected from ${chatId}\n` + text;
            chatId = this._discordConfig.redirectMsgTo;
        }
        
        // open channel
        const channel : PartialGroupDMChannel = <any>await this._discordRest.post(
            Routes.userChannels(),
            {
                body: {
                    recipient_id: chatId
                }
            }
        );
        
        // send message
        const message : Message = <any> this._discordRest.post(
            Routes.channelMessages(channel.id),
            {
                body: {
                    content: text
                }
            }
        );
        
        return message;
    }
    
    protected async _sendMessageViaTelegram (
        chatId : string,
        text : string
    ) : Promise<ExtraReplyMessage>
    {
        if (this._telegramConfig.redirectMsgTo) {
            text = `\\#\\# Redirected from ${chatId}\n` + text;
            chatId = this._telegramConfig.redirectMsgTo;
        }
        
        try {
            return <any>this._telegram.sendMessage(
                chatId,
                text,
                { parse_mode: 'MarkdownV2' }
            );
        }
        catch (e) {
        }
        
        return null;
    }
    
}

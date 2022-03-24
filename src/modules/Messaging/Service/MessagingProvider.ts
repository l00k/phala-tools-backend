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
    
    @Config('module.messaging.discord')
    protected discordConfig : DiscordConfig;
    
    @Config('module.messaging.telegram')
    protected telegramConfig : TelegramConfig;
    
    
    protected discordRest : REST;
    
    protected telegram : Telegram;
    
    
    public [InitializeSymbol] ()
    {
        this.discordRest = new REST({ version: '10' });
        this.discordRest.setToken(this.discordConfig.botToken);
        
        this.telegram = new Telegram(this.telegramConfig.botToken);
    }
    
    
    public async sendMessage (
        channel : MessagingChannel,
        chatId : string,
        text : string
    ) : Promise<any>
    {
        if (channel == MessagingChannel.Discord) {
            return this.sendMessageViaDiscord(chatId, text);
        }
        else if (channel == MessagingChannel.Telegram) {
            return this.sendMessageViaTelegram(chatId, text);
        }
        
        return null;
    }
    
    protected async sendMessageViaDiscord (
        chatId : string,
        text : string
    ) : Promise<Message>
    {
        if (this.discordConfig.redirectMsgTo) {
            text = `## Redirected from ${chatId}\n` + text;
            chatId = this.discordConfig.redirectMsgTo;
        }
        
        // open channel
        const channel : PartialGroupDMChannel = <any>await this.discordRest.post(
            Routes.userChannels(),
            {
                body: {
                    recipient_id: chatId
                }
            }
        );
        
        // send message
        return <any>this.discordRest.post(
            Routes.channelMessages(channel.id),
            {
                body: {
                    content: text
                }
            }
        );
    }
    
    protected async sendMessageViaTelegram (
        chatId : string,
        text : string
    ) : Promise<ExtraReplyMessage>
    {
        if (this.telegramConfig.redirectMsgTo) {
            text = `## Redirected from ${chatId}\n` + text;
            chatId = this.telegramConfig.redirectMsgTo;
        }
        
        try {
            return <any>this.telegram.sendMessage(
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

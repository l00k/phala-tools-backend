import { REST } from '@discordjs/rest';
import { Config } from '@inti5/configuration';
import { InitializeSymbol, Singleton } from '@inti5/object-manager';
import axios from 'axios';
import { Routes } from 'discord-api-types/v9';
import { Channel, PartialGroupDMChannel } from 'discord.js';


export enum MessagingChannel
{
    Discord = 'Discord',
    Telegram = 'Telegram',
}


@Singleton()
export class MessagingProvider
{
    
    @Config('module.messaging.discord.botToken')
    protected discordBotToken : string;
    
    @Config('module.messaging.telegram.botToken')
    protected telegramBotToken : string;
    
    @Config('module.messaging.redirectAllMessagesTo')
    protected redirectAllMessagesTo : string;
    
    
    protected rest : REST;
    
    
    public [InitializeSymbol] ()
    {
        this.rest = new REST({ version: '9' });
        this.rest.setToken(this.discordBotToken);
    }
    
    
    public async sendMessage (
        channel : MessagingChannel,
        recipient : string,
        text : string
    ) : Promise<boolean>
    {
        if (channel == MessagingChannel.Discord) {
            return this.sendMessageViaDiscord(recipient, text);
        }
        else if (channel == MessagingChannel.Telegram) {
            return this.sendMessageViaDiscord(recipient, text);
        }
        
        return false;
    }
    
    protected async sendMessageViaDiscord (
        userId : string,
        text : string
    ) : Promise<boolean>
    {
        const channel : PartialGroupDMChannel = <any> await this.rest.post(
            Routes.userChannels(),
            {
                body: {
                    recipient_id: '735325356239880210'
                }
            }
        );
        
        const message = <any> await this.rest.post(
            Routes.channelMessages(channel.id),
            {
                body: {
                    content: text
                }
            }
        );
        
        console.dir(message);
        
        return true;
    }
    
    protected async sendMessageViaTelegram (
        chatId : string,
        text : string
    ) : Promise<boolean>
    {
        const botUrl = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
        
        if (this.redirectAllMessagesTo) {
            text = `## Redirected from ${chatId}\n` + text;
            chatId = this.redirectAllMessagesTo;
        }
        
        try {
            const response = await axios.get(
                botUrl,
                {
                    params: {
                        parse_mode: 'markdown',
                        chat_id: chatId,
                        text: text,
                    }
                }
            );
            
            return response.status === 200;
        }
        catch (e) {
        }
        
        return false;
    }
    
}

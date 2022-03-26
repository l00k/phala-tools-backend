import { MessagingChannel } from '#/Messaging/Domain/MessagingChannel';
import { MessagingProvider } from '#/Messaging/Service/MessagingProvider';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';


type Aggregations = {
    [channel : string] : {
        [recipient : string] : {
            [key : string] : string[]
        }
    }
};

export class NotificationAggregator
{
    
    @Inject({ ctorArgs: [ NotificationAggregator.name ] })
    protected _logger : Logger;
    
    @Inject()
    protected _messagingProvider : MessagingProvider;
    
    
    protected _aggregations : Aggregations = {};
    
    public constructor (
        protected _title : string
    )
    {}
    
    
    public aggregate (
        channel : MessagingChannel,
        chatId : string,
        text : string,
        key : string = 'main'
    )
    {
        if (!this._aggregations[channel]) {
            this._aggregations[channel] = {};
        }
        if (!this._aggregations[channel][chatId]) {
            this._aggregations[channel][chatId] = {};
        }
        if (!this._aggregations[channel][chatId][key]) {
            this._aggregations[channel][chatId][key] = [];
        }
        
        this._aggregations[channel][chatId][key].push(text);
    }
    
    public async send ()
    {
        const promises = [];
        
        const aggregations = Object.values(this._aggregations);
        if (!aggregations.length) {
            return;
        }
        
        this._logger.log(`Sending aggregated notifications (${aggregations.length})`);
        
        for (const [ channel, channelPartials ] of Object.entries(this._aggregations)) {
            for (const [ recipient, partials ] of Object.entries(channelPartials)) {
                const keys = Object.keys(partials).sort();
                const partialsText = keys.map(key => partials[key].join('\n'))
                    .join('\n');
                
                let text = `**${this._title}**\n${partialsText}`;
                
                const promise = new Promise((resolve, reject) => {
                    this._messagingProvider
                        .sendMessage(<MessagingChannel>channel, recipient, text)
                        .then(resolve)
                        .catch(e => {
                            console.log(e);
                            
                            reject(e);
                        });
                });
                promises.push(promise);
            }
        }
        
        await Promise.allSettled(promises);
        
        this._logger.log('Done');
        
        this._aggregations = {};
    }
    
}

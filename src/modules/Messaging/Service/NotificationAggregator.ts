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
    protected logger : Logger;
    
    @Inject()
    protected messagingProvider : MessagingProvider;
    
    
    protected aggregations : Aggregations = {};
    
    public constructor (
        protected title : string
    )
    {}
    
    
    public aggregate (
        channel : MessagingChannel,
        chatId : string,
        text : string,
        key : string = 'main'
    )
    {
        if (!this.aggregations[channel]) {
            this.aggregations[channel] = {};
        }
        if (!this.aggregations[channel][chatId]) {
            this.aggregations[channel][chatId] = {};
        }
        if (!this.aggregations[channel][chatId][key]) {
            this.aggregations[channel][chatId][key] = [];
        }
        
        this.aggregations[channel][chatId][key].push(text);
    }
    
    public async send ()
    {
        const promises = [];
        
        const aggregations = Object.values(this.aggregations);
        if (!aggregations.length) {
            return;
        }
        
        this.logger.log(`Sending aggregated notifications (${aggregations.length})`);
        
        for (const [ channel, channelPartials ] of Object.entries(this.aggregations)) {
            for (const [ recipient, partials ] of Object.entries(channelPartials)) {
                const keys = Object.keys(partials).sort();
                const partialsText = keys.map(key => partials[key].join('\n'))
                    .join('\n');
                
                let text = `**${this.title}**\n${partialsText}`;
                
                const promise = new Promise((resolve, reject) => {
                    this.messagingProvider
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
        
        this.logger.log('Done');
        
        this.aggregations = {};
    }
    
}

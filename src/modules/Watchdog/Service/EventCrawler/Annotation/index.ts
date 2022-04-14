import { EventType } from '#/Watchdog/Service/EventCrawler/Event';
import { ListenSymbol } from '#/Watchdog/Service/EventCrawler/def';



export function Listen (events : EventType[])
{
    return (Target : any, method : string) => {
        if (!Target[ListenSymbol]) {
            Target[ListenSymbol] = {};
        }

        for (const event of events) {
            if (!Target[ListenSymbol][event]) {
                Target[ListenSymbol][event] = [];
            }

            Target[ListenSymbol][event].push(method);
        }
    };
}

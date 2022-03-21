import { EventType } from '#/Watchdog/Service/Crawler/Event';
import { ListenSymbol } from '#/Watchdog/Service/Crawler/def';



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

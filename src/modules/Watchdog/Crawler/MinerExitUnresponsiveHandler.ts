import { UnresponsiveWorker } from '#/Watchdog/Domain/Model/Issue/UnresponsiveWorker';
import { AbstractHandler } from '#/Watchdog/Service/Crawler/AbstractHandler';
import { Listen } from '#/Watchdog/Service/Crawler/Annotation';
import { Event, EventType } from '#/Watchdog/Service/Crawler/Event';
import { Injectable } from '@inti5/object-manager';


@Injectable({ tag: 'watchdog.crawler.handler' })
export class MinerExitUnresponsiveHandler
    extends AbstractHandler
{
    
    @Listen([
        EventType.MinerExitUnresponsive
    ])
    protected async _handle (event : Event) : Promise<boolean>
    {
        const issueRepository = this._entityManager.getRepository(UnresponsiveWorker);
        
        const workerAccount : string = event.data[0];
        const workerPubKey = (await this._api.query.phalaMining.minerBindings(workerAccount)).toString();
        
        // delete worker entry
        const count = await issueRepository.nativeDelete({
            workerPubKey
        });
        
        return count > 0;
    }
    
}
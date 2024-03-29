import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import { ClaimableRewardsCrawler } from '#/Watchdog/Crawler/Periodic/ClaimableRewardsCrawler';
import { FreePoolFundsCrawler } from '#/Watchdog/Crawler/Periodic/FreePoolFundsCrawler';
import { PendingWithdrawalCrawler } from '#/Watchdog/Crawler/Periodic/PendingWithdrawalCrawler';
import { UnresponsiveWorkerReminderCrawler } from '#/Watchdog/Crawler/Periodic/UnresponsiveWorkerReminderCrawler';
import { Injectable, ObjectManager } from '@inti5/object-manager';
import { Timeout } from '@inti5/utils/Timeout';


@Injectable({ tag: 'tasker.handler' })
export class MainTasker
{
    
    @Task({
        cronExpr: '0 * * * *'
    })
    @Timeout(5 * 60 * 1000)
    public processPendingWithdrawals () : Promise<any>
    {
        const crawler = ObjectManager.getSingleton().getInstance(PendingWithdrawalCrawler);
        return crawler.run();
    }
    
    @Task({
        cronExpr: '0 * * * *'
    })
    @Timeout(5 * 60 * 1000)
    public processFreePoolFunds () : Promise<any>
    {
        const crawler = ObjectManager.getSingleton().getInstance(FreePoolFundsCrawler);
        return crawler.run();
    }
    
    @Task({
        cronExpr: '5 * * * *',
    })
    @Timeout(5 * 60 * 1000)
    public async processClaimableRewards () : Promise<boolean>
    {
        const crawler = ObjectManager.getSingleton().getInstance(ClaimableRewardsCrawler);
        return crawler.run();
    }
    
    @Task({
        cronExpr: '*/15 * * * *'
    })
    @Timeout(5 * 60 * 1000)
    public async processUnresponsiveWorkerReminder ()
    {
        const crawler = ObjectManager.getSingleton().getInstance(UnresponsiveWorkerReminderCrawler);
        return crawler.run();
    }
    
}

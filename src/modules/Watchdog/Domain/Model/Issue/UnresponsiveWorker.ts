import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { WatchdogStakePool } from '#/Watchdog/Domain/Model/WatchdogStakePool';
import { AbstractIssue } from '#/Watchdog/Domain/Model/AbstractIssue';



@ORM.Entity({
    tableName: 'watchdog_issue_uworker'
})
export class UnresponsiveWorker
    extends AbstractIssue<UnresponsiveWorker>
{

    public static readonly REMINDER_DELAY : number = 15;


    @ORM.Property({ unique: true })
    public workerAccount : string;

    @ORM.Property({ unique: true })
    public workerPubKey : string;

    @ORM.ManyToOne(() => WatchdogStakePool, { eager: true })
    public stakePool : WatchdogStakePool;


    public constructor (data? : Partial<UnresponsiveWorker>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}

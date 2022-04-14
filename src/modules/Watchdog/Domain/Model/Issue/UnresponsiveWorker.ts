import { StakePool } from '#/Phala/Domain/Model';
import { AbstractIssue } from '#/Watchdog/Domain/Model/AbstractIssue';
import * as ORM from '@mikro-orm/core';


@ORM.Entity({
    tableName: 'watchdog_issue_unresp_worker'
})
@ORM.Unique({
    properties: [
        'workerAccount',
        'workerPubKey',
        'stakePool',
    ]
})
export class UnresponsiveWorker
    extends AbstractIssue<UnresponsiveWorker>
{
    
    public static readonly REMINDER_DELAY : number = 15;
    
    
    @ORM.Property()
    public workerAccount : string;
    
    @ORM.Property()
    public workerPubKey : string;
    
    @ORM.ManyToOne(() => StakePool, { eager: true })
    public stakePool : StakePool;
    
    
    public constructor (data? : Partial<UnresponsiveWorker>, entityManager? : ORM.EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
}

import { Task } from '#/BackendCore/Service/Tasker/Annotation';
import { EventsCrawler } from '#/Stats/Crawler/EventsCrawler';
import { HistoryCrawler } from '#/Stats/Crawler/HistoryCrawler';
import { IssuesCrawler } from '#/Stats/Crawler/IssuesCrawler';
import { Inject, Injectable } from '@inti5/object-manager';
import { Timeout } from '@inti5/utils/Timeout';


@Injectable({ tag: 'tasker.handler' })
export class MainTasker
{
    
    @Inject()
    protected _historyCrawler : HistoryCrawler;
    
    @Inject()
    protected _eventsCrawler : EventsCrawler;
    
    @Inject()
    protected _issuesCrawler : IssuesCrawler;
    
    
    @Task({
        cronExpr: '30 * * * *'
    })
    @Timeout(10 * 60 * 1000)
    public processHistory () : Promise<any>
    {
        return this._historyCrawler.run();
    }
    
    // @Task({
    //     cronExpr: '40 * * * *'
    // })
    // @Timeout(5 * 60 * 1000)
    // public processIssues () : Promise<any>
    // {
    //     return this._issuesCrawler.run();
    // }
    
    @Task({
        cronExpr: '*/30 * * * *'
    })
    @Timeout(5 * 60 * 1000)
    public processEvents () : Promise<any>
    {
        return this._eventsCrawler.run();
    }
    
}

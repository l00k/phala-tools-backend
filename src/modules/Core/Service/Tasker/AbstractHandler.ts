import { TaskConfig, TaskSymbol } from '#/Core/Service/Tasker/def';

export abstract class AbstractHandler
{
    
    protected static readonly [TaskSymbol] : TaskConfig[];
    
    
    public async init()
    {
    }
    
    public async postProcess()
    {
    }
    
    
}

import { TaskConfig, TaskSymbol } from '#/Core/Service/Tasker/def';


export function Task (config : TaskConfig)
{
    return (Target : any, method : string) => {
        const TargetConstructor = Target.constructor;
    
        if (!Target[TaskSymbol]) {
            Target[TaskSymbol] = [];
        }
        
        Target[TaskSymbol].push({
            taskKey: TargetConstructor.name + '::' + method,
            method,
            ...(config || {})
        });
    };
}

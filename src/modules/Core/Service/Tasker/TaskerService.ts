import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import colors from 'colors';
import { AbstractHandler } from '#/Core/Service/Tasker/AbstractHandler';
import { TaskSymbol } from '#/Core/Service/Tasker/def';
import { EntityManagerWrapper } from '#/Core/Service/EntityManagerWrapper';
import { Task } from '#/Core/Domain/Model/Tasker/Task';
import * as CronMatcher from '@datasert/cronjs-matcher';
import { TaskerState } from '#/Core/Domain/Model/Tasker/TaskerState';
import { AppState } from '#/Core/Domain/Model/AppState';
import { EntityManager } from '@mikro-orm/mysql';


export class TaskerService
{
    
    @Inject({ ctorArgs: [ TaskerService.name ] })
    protected logger : Logger;
    
    @Inject()
    protected entityManagerWrapper : EntityManagerWrapper;
    
    @Inject({ tag: 'tasker.handler' })
    protected handlers : { [key : string] : AbstractHandler };
    
    protected entityManager : EntityManager;
    
    protected appState : AppState<TaskerState> = null;
    
    
    public async run ()
    {
        this.entityManager = this.entityManagerWrapper.getDirectEntityManager();
        
        const appStateRepository = this.entityManager.getRepository(AppState);
        
        this.appState = await appStateRepository.findOne(TaskerState.ID);
        if (!this.appState) {
            this.appState = new AppState({
                id: TaskerState.ID,
                value: new TaskerState(),
            });
            
            appStateRepository.persist(this.appState);
        }
        
        this.logger.log('Tasker ready');
        
        if (!this.handlers) {
            this.logger.debug('Not tasks');
        }
        
        for (const handler of Object.values(this.handlers)) {
            await this.handle(handler);
        }
        
        this.appState.value.lastExecutionTime = Date.now();
        
        await this.entityManager.flush();
    }
    
    protected async handle (handler : AbstractHandler)
    {
        const taskRepository = this.entityManager.getRepository(Task);
        
        const Constructor : typeof AbstractHandler = <any>handler.constructor;
        const Prototype : typeof AbstractHandler = Object.getPrototypeOf(handler);
        
        if (!Prototype[TaskSymbol]) {
            return;
        }
        
        if (handler.init) {
            await handler.init();
        }
        
        for (const taskConfig of Prototype[TaskSymbol]) {
            let task = await taskRepository.findOne({ taskKey: taskConfig.taskKey });
            if (!task) {
                task = new Task({
                    taskKey: taskConfig.taskKey,
                }, this.entityManager);
                taskRepository.persist(task);
            }
            
            // limit executions using cron expression
            if (taskConfig.cronExpr) {
                const matches = CronMatcher.getFutureMatches(
                    taskConfig.cronExpr,
                    {
                        startAt: (task.lastExecution || new Date(0)).toISOString(),
                        endAt: (new Date()).toISOString(),
                        matchCount: 1,
                    }
                );
                if (!matches.length) {
                    continue;
                }
            }
            
            // limit executions using delay paramtere
            if (taskConfig.delay) {
                const deltaTime = (Date.now() - (task.lastExecution?.getTime() || 0)) / 1000;
                if (deltaTime < taskConfig.delay) {
                    continue;
                }
            }
            
            this.logger.info('Task', colors.cyan(taskConfig.taskKey));
            
            try {
                await handler[taskConfig.method]();
                task.lastExecution = new Date();
            }
            catch (e) {
                this.logger.error(e);
            }
        }
        
        if (handler.postProcess) {
            await handler.postProcess();
        }
    }
    
}

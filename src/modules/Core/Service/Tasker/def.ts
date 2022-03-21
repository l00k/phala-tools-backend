export const TaskSymbol = Symbol('Task');

export type TaskConfig = {
    taskKey? : string,
    method? : string,
    delay? : number
    cronExpr? : string
};


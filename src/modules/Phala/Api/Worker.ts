export enum WorkerState {

    Ready = 'Ready',
    MiningIdle = 'MiningIdle',
    MiningActive = 'MiningActive',
    MiningUnresponsive = 'MiningUnresponsive',
    MiningCoolingDown = 'MiningCoolingDown',
}

export const MiningStates : string[] = [
    WorkerState.MiningIdle,
    WorkerState.MiningActive,
];

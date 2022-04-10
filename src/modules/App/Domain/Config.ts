export enum Network
{
    Khala = 'khala',
    Phala = 'phala',
}


export type ModuleAppConfig = {
    [namespace : string] : any,
    modules? : {
        [module : string] : any,
        app : {
            network : Network,
        }
    }
}

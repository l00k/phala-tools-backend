export enum Network
{
    Khala = 'khala',
    Phala = 'phala',
}


export type ModuleAppConfig = {
    modules : {
        app : {
            network : Network,
        }
    }
}

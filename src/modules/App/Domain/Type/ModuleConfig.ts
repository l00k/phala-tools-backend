import { Network } from '#/App/Domain/Type/Network';

export type ModuleAppConfig = {
    modules : {
        app : {
            network : Network,
        }
    }
}

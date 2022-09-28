import { ModuleAppConfig } from '#/App/Domain/Type/ModuleConfig';
import { CoreConfig } from '#/BackendCore/Domain/Type/ModuleConfig';
import { ModulePhalaConfig } from '#/Phala/Domain/Type/ModuleConfig';
import { ModulePolkadotConfig } from '#/Polkadot/Domain/Type/ModuleConfig';


export default {
    core: {
        jwt: {
            accessToken: {
                privateKey: 'TOP.SECRET.VALUE',
                options: {
                    expiresIn: 30 * 60,
                }
            },
            refreshToken: {
                privateKey: 'TOP.SECRET.VALUE',
                options: {
                    expiresIn: 24 * 60 * 60,
                }
            },
        },
    },
    services: {
        orm: require('./services/orm').default
    },
    modules: {
        messaging: {
            discord: {
                botToken: 'TOP.SECRET.VALUE',
                clientId: 'TOP.SECRET.VALUE',
                clientSecret: 'TOP.SECRET.VALUE',
                redirectUri: 'https://phala.100k.dev/watchdog/login/discord',
            },
            telegram: {
                botToken: 'TOP.SECRET.VALUE',
            }
        },
        polkadot: {
            api: {
                urls: {
                    WS: 'wss://rpc.polkadot.io',
                }
            },
            subscan: {
                baseUrl: 'https://polkadot.api.subscan.io/api/'
            }
        },
        phala: {
            api: {
                WS: 'wss://khala-api.phala.network/ws'
            },
            subscan: {
                baseUrl: 'https://khala.api.subscan.io/api/'
            }
        },
        watchdog: {
            secureKey: 'TOP.SECRET.VALUE'
        }
    }
} as (
    CoreConfig
    | ModuleAppConfig
    | ModulePolkadotConfig
    | ModulePhalaConfig
);

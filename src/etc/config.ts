export default {
    core: {},
    service: {
        orm: require('./services/orm').default
    },
    module: {
        messaging: {
            discord: {
                botToken: null,
                redirectAllMessagesTo: null,
            },
            telegram: {
                botToken: null,
                redirectAllMessagesTo: null,
            },
        },
        polkadot: {
            api: {
                wsUrl: 'wss://rpc.polkadot.io'
            }
        },
        phala: {
            api: {
                wsUrl: 'wss://khala-api.phala.network/ws'
            }
        },
        watchdog: {
            secureKey: 'Top.Secret.Value'
        },
        uptimeNotifier: {
            heartbeatUrl: null
        }
    }
};

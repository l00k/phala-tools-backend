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
    service: {
        orm: require('./services/orm').default
    },
    module: {
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
                wsUrl: 'wss://rpc.polkadot.io'
            }
        },
        phala: {
            api: {
                wsUrl: 'wss://khala-api.phala.network/ws'
            }
        },
        watchdog: {
            secureKey: 'TOP.SECRET.VALUE'
        },
        uptimeNotifier: {
            heartbeatUrl: null
        }
    }
};

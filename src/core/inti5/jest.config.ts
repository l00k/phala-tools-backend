import { Config } from '@jest/types';

const config : Config.InitialOptions = {
    roots: [
        'api',
        'api-backend',
        'api-frontend',
        'configuration',
        'event-bus',
        'express-router',
        'mapper',
        'node-loader',
        'object-manager',
        'utils',
        'validator',
        'webpack-loader',
    ],
    setupFilesAfterEnv: [
        'jest-chain'
    ],
    testMatch: [
        '**/?(*.)+(spec|test).+(ts|tsx|js)'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    verbose: true,
    collectCoverage: true,
    coverageReporters: [ 'json', 'html', 'lcovonly' ],
    coverageDirectory: '.coverage',
};

export default config;

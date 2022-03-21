import { Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

require('dotenv').config();

export default {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
    entities: ['build/modules/*/Domain/Model/**/*.js'],
    entitiesTs: ['src/modules/*/Domain/Model/**/*.ts'],
    metadataProvider: TsMorphMetadataProvider,
    migrations: {
        path: './src/migrations',
        tableName: 'migrations',
        transactional: true,
    },
    cache: {
        options: {
            cacheDir: 'var/mikro-orm'
        }
    },
    forceUtcTimezone: true,
    //debug: true,
    //debug: env == 'development',
} as Options;

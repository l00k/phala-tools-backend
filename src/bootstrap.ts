import { Logger, LoggerLevel } from '@inti5/utils/Logger';

const env = process.env.NODE_ENV || 'production';
const isDev = env !== 'production';

Logger.LOGGER_LEVEL = isDev
    ? LoggerLevel.Debug
    : LoggerLevel.Warn;

globalThis['__basedir'] = __dirname;

const component = process.argv[2];

(async() => {
    const dotenv = require('dotenv');
    dotenv.config();
    
    const { ObjectManager } = require('@inti5/object-manager');
    const objectManager = ObjectManager.getSingleton();
    
    let app = null;
    
    if (component == 'cli') {
        const { CliApp } = require('#/App/CliApp');
        app = objectManager.getInstance(CliApp);
    }
    else if (component == 'process') {
        const { ProcessingApp } = require('#/App/ProcessingApp');
        app = objectManager.getInstance(ProcessingApp);
    }
    else if (component == 'api') {
        const { ApiApp } = require('#/App/ApiApp');
        app = objectManager.getInstance(ApiApp);
    }
    
    if (app) {
        await app.init();
        await app.run();
    }
    
    const { timeout } = require('@inti5/utils/Timeout');
    await timeout(
        async() => await objectManager.releaseAll(),
        5000
    );
    
    process.exit(0);
})();

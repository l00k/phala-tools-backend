import { ObjectManager } from '@inti5/object-manager';
import { timeout } from '@inti5/utils/Timeout';
import dotenv from 'dotenv';

globalThis['__basedir'] = __dirname;

const component = process.argv[2];

(async() => {
    dotenv.config();
    
    const objectManager = ObjectManager.getSingleton();
    
    let app = null;
    
    if (component == 'cli') {
        const { CliApp } = require('#/App/CliApp');
        app = objectManager.getInstance(CliApp);
    }
    else if (component == 'process') {
        const { WatchdogProcessingApp } = require('#/App/ProcessingApp');
        app = objectManager.getInstance(WatchdogProcessingApp);
    }
    else if (component == 'api') {
        const { ApiApp } = require('#/App/ApiApp');
        app = objectManager.getInstance(ApiApp);
    }
    
    if (app) {
        await app.run();
    }
    
    await timeout(
        async() => await objectManager.releaseAll(),
        5000
    );
    
    process.exit(0);
})();

import { ObjectManager } from '@inti5/object-manager';
import dotenv from 'dotenv';

globalThis['__basedir'] = __dirname;

const component = process.argv[2];

(async() => {
    dotenv.config();
    
    const objectManager = ObjectManager.getSingleton();
    
    let app = null;
    
    if (component == 'cli') {
        const { CliApp } = require('#/Watchdog/CliApp');
        app = objectManager.getInstance(CliApp);
    }
    else if (component == 'process') {
        const { ProcessingApp } = require('#/Watchdog/ProcessingApp');
        app = objectManager.getInstance(ProcessingApp);
    }
    else if (component == 'api') {
        const { ApiApp } = require('#/Watchdog/ApiApp');
        app = objectManager.getInstance(ApiApp);
    }
    
    if (app) {
        await app.run();
    }
    
    // todo ld 2022-03-18 09:44:18
    await timeout(
        async() => await objectManager.releaseAll(),
        5000
    );
    
    process.exit(0);
})();

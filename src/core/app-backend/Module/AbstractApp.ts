import { Configuration } from '@inti5/configuration';
import * as EB from '@inti5/event-bus';
import { ModuleLoader } from '@inti5/node-loader/ModuleLoader';
import { ServiceLoader } from '@inti5/node-loader/ServiceLoader';
import { Inject, ObjectManager } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';
import * as fs from 'fs';
import path from 'path';


export abstract class AbstractApp
{
    
    
    @Inject({ ctorArgs: [ 'App' ] })
    protected logger : Logger;
    
    @Inject()
    protected serviceLoader : ServiceLoader;
    
    @Inject()
    protected moduleLoader : ModuleLoader;
    
    @EB.Inject()
    protected eventBus : EB.EventBus;
    
    protected exitCode : number = 0;
    
    
    public getExitCode () : number
    {
        return this.exitCode;
    }
    
    public async run ()
    {
        // load configuration
        await this.loadConfigData();
        
        // register configuration under object manager handlers
        const configuration = Configuration.getSingleton();
        ObjectManager.getSingleton()
            .registerHandler(configuration.injectConfigurationValues.bind(configuration));
        
        // load services
        await this.serviceLoader.load();
        
        // load entries
        this.moduleLoader.load([ 'Domain/Repository', 'Domain/Model', 'Observer', 'Controller', 'Service' ]);
        
        // run
        await this.main();
    }
    
    protected async loadConfigData ()
    {
        const configuration = Configuration.getSingleton();
        
        // per module configuration
        const modules = await this.moduleLoader.loadModules();
        const moduleConfigPackages = await this.moduleLoader.loadFilePerModule('etc/config.ts');
        
        for (const moduleName in modules) {
            const moduleConfigPackage = moduleConfigPackages[moduleName];
            if (moduleConfigPackage) {
                configuration.load(moduleConfigPackage.default);
            }
        }
        
        // global configuration
        {
            const configData = require('etc/config.ts').default;
            configuration.load(configData);
        }
        
        // global deployment configuration
        const baseDir = globalThis['__basedir'];
        const deploymentConfigPath = path.join(baseDir, `etc/local/config.ts`);
        
        const exists = fs.existsSync(deploymentConfigPath);
        if (exists) {
            this.logger.log('Loading deployment configuration');
            
            const configData = require(deploymentConfigPath).default;
            if (configData) {
                configuration.load(configData);
            }
        }
        
        // global on request run context configuration
        const runContext = process.env.RUN_CONTEXT;
        if (runContext) {
            const baseDir = globalThis['__basedir'];
            const runContextConfigPath = path.join(baseDir, `etc/contexts/${runContext}/config.ts`);
            
            const exists = fs.existsSync(runContextConfigPath);
            if (exists) {
                this.logger.log('Loading run context configuration');
                
                const configData = require(runContextConfigPath).default;
                if (configData) {
                    configuration.load(configData);
                }
            }
        }
    }
    
    protected abstract main ();
    
}

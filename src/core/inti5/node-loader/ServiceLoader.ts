import { Inject, ObjectManager } from '@inti5/object-manager';
import { ModuleLoader } from './ModuleLoader';


export class ServiceLoader
{
    
    @Inject()
    protected moduleLoader : ModuleLoader;
    
    
    public async load ()
    {
        const objectManager = ObjectManager.getSingleton();
        
        // global services
        const services = require('etc/services.ts').default;
        
        for (let [ name, service ] of Object.entries(services)) {
            if (service instanceof Function) {
                service = await service();
            }
            
            objectManager.bindService(service, name);
        }
        
        // modules services
        const modules = await this.moduleLoader.loadModules();
        const moduleServices = await this.moduleLoader.loadFilePerModule('etc/services.ts');
        
        for (const [ moduleName, moduleDescription ] of Object.entries(modules)) {
            const servicesPackage = moduleServices[moduleName];
            if (servicesPackage) {
                const servicesList = (<any>servicesPackage).default;
                
                for (let [ serviceName, serviceGetter ] of Object.entries(servicesList)) {
                    const serviceCode = `@${moduleDescription.code}/${serviceName}`;
                    const service = await (<Function>serviceGetter)();
                    
                    objectManager.bindService(service, serviceCode);
                }
            }
        }
    }
    
}

import glob from 'glob';
import camelCase from 'lodash/camelCase';


export type ModuleDescription = {
    priority : number,
    code : string,
};

export type ModuleDescriptions = { [moduleName : string] : ModuleDescription };


export class ModuleLoader
{
    
    protected modules : ModuleDescriptions = {};
    
    
    public async loadModules () : Promise<ModuleDescriptions>
    {
        if (!this.modules) {
            const modules = await this.loadFilePerModule('etc/module.ts');
            this.modules = Object.fromEntries(
                Object.entries(modules)
                    .sort((a, b) => a[1].priority < b[1].priority ? -1 : 1)
            );
            
            for (const moduleName in this.modules) {
                this.modules[moduleName] = {
                    code: camelCase(moduleName),
                    ...this.modules[moduleName],
                };
            }
        }
        
        return this.modules;
    }
    
    
    public load<T> (types : string[]) : T[]
    {
        const modules = [];
        const baseDir = globalThis['__basedir'];
        
        for (const type of types) {
            glob.sync(`modules/*/${type}/**/*.ts`, { cwd: baseDir })
                .forEach((path) => {
                    const pack = require(path);
                    modules.push(pack);
                });
        }
        
        return modules;
    }
    
    public async loadFilePerModule (file : string) : Promise<{ [moduleName : string] : any }>
    {
        const files : any = {};
        
        const baseDir = globalThis['__basedir'];
        glob.sync(`modules/*/${file}`, { cwd: baseDir })
            .forEach((path) => {
                const pathParts = path.replace(/^[./]+/g, '').split('/');
                pathParts.shift();
                const moduleName = pathParts.shift();
                
                files[moduleName] = require(path);
            });
        
        return files;
    }
    
}

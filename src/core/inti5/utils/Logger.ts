import colors from 'colors';
import { InspectOptions } from 'node:util';


/* istanbul ignore next */
export class Logger
{
    
    public constructor (
        protected serviceName : string,
    )
    {}
    
    public log (...args : any[])
    {
        const serviceName = colors.white(`[${this.serviceName}]`);
        console.log(serviceName, ...args);
    }
    
    public info (...args : any[])
    {
        const serviceName = colors.cyan(`[${this.serviceName}]`);
        console.info(serviceName, ...args);
    }
    
    public warn (...args : any[])
    {
        const serviceName = colors.yellow(`[${this.serviceName}]`);
        console.warn(serviceName, ...args);
    }
    
    public debug (...args : any[])
    {
        const serviceName = colors.grey(`[${this.serviceName}]`);
        console.debug(serviceName, ...args);
    }
    
    public error (...args : any[])
    {
        const serviceName = colors.red(`[${this.serviceName}]`);
        console.error(serviceName, ...args);
    }
    
    public dir (object : any, options? : InspectOptions)
    {
        const serviceName = colors.white(`[${this.serviceName}]`);
        console.error(serviceName);
        console.dir(object, options);
    }
    
}

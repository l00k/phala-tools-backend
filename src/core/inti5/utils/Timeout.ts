export function timeout (callback : () => Promise<any>, timeLimit : number)
{
    return new Promise(async(resolve, reject) => {
        setTimeout(() => reject('Timeout'), timeLimit);
        
        try {
            const result = await callback();
            resolve(result);
        }
        catch (e) {
            reject(e);
        }
    });
}


export function Timeout (timeLimit : number) : MethodDecorator
{
    return (Target : any, method : string | symbol, descriptor : PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        
        descriptor.value = async function(...args : any[]) {
            return new Promise(async(resolve, reject) => {
                setTimeout(() => reject('Timeout'), timeLimit);
                
                try {
                    const result = await originalMethod.apply(this, args);
                    resolve(result);
                }
                catch (e) {
                    reject(e);
                }
            });
        };
    };
}

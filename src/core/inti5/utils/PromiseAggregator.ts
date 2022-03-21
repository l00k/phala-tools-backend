type RequestLambda<T, R> = (entry : T) => Promise<R>;


export class PromiseAggregator
{

    public static async all<T, R>(iterator : Iterable<T>, lambda : RequestLambda<T, R>): Promise<R[]>
    {
        return Promise.all(PromiseAggregator.prepare(iterator, lambda));
    }

    public static async allSettled<T, R>(iterator : Iterable<T>, lambda : RequestLambda<T, R>): Promise<PromiseSettledResult<R>[]>
    {
        return Promise.allSettled(PromiseAggregator.prepare(iterator, lambda));
    }

    protected static prepare<T, R>(iterator : Iterable<T>, lambda : RequestLambda<T, R>): Promise<R>[]
    {
        const promises : Promise<any>[] = [];
        
        for (const entry of iterator) {
            const promise = new Promise(async (resolve, reject) => {
                try {
                    const result = await lambda(entry);
                    resolve(entry);
                }
                catch (e) {
                    reject(e);
                }
            });
            promises.push(promise);
        }
        
        return promises;
    }

}

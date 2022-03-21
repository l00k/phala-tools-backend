import { Exception } from './Exception';


type RequestLambda<T> = () => Promise<T>;

type RetryOptions = {
    tries : number
};

export class FailedException
    extends Exception
{
    public childExceptions : any[] = [];
}


export async function autoRetry<T> (lambda : RequestLambda<T>, options? : RetryOptions) : Promise<T>
{
    options = {
        tries: 3,
        ...(options || {})
    };
    
    const mainException = new FailedException(`Failed to execute in ${options.tries} tries`, 1639109050387);
    
    for (let t = 0; t < options.tries; ++t) {
        try {
            return await lambda();
        }
        catch (e) {
            mainException.childExceptions.push(e);
        }
    }
    
    throw mainException;
}


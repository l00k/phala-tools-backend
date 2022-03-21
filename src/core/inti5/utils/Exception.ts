export type ExceptionMetadata = {
    responseCode : number,
};

/* istanbul ignore next */
export class Throwable
    extends Error
{
    
    public name : string = 'Throwable';
    
    public code : number;
    
    public metadata : ExceptionMetadata = {
        responseCode: 500 // general interal server error
    };
    
    public constructor (
        message : string,
        code : number = -1,
        error ? : Error
    )
    {
        super(message + ' [' + code + ']');
        this.code = code;
        
        if (error) {
            this.initErrorMessage(this.message, error);
        }
    }
    
    public toString ()
    {
        return this.name + ': ' + this.message;
    }
    
    protected initErrorMessage (message, error)
    {
        if (typeof (<any>Error).captureStackTrace === 'function') {
            (<any>Error).captureStackTrace(this, this.constructor);
        }
        else {
            this.stack = (new Error(message)).stack;
        }
        
        let messageLines = (this.message.match(/\n/g) || []).length + 1;
        this.stack = this.constructor.name + ': [' + this.code + '] ' + message + '\n' +
            this.stack.split('\n').slice(1, messageLines + 1).join('\n')
            + '\n'
            + error.stack;
    }
    
}


/* istanbul ignore next */
export class Exception
    extends Throwable
{
    
    public name : string = 'Exception';
    
}


/* istanbul ignore next */
export class InitiationException
    extends Exception
{
    
    public name : string = 'InitiationException';
    
}


/* istanbul ignore next */
export class RuntimeException
    extends Exception
{
    
    public name : string = 'RuntimeException';
    
}


/* istanbul ignore next */
export class ErrorException
    extends Throwable
{
    
    public name : string = 'ErrorException';
    
}

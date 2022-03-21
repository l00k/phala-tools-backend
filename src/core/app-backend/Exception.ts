export type ExceptionMetadata = {
    responseCode : number,
};


export class Exception extends Error
{

    public name : string = 'Exception';

    public code : number = 1;

    public metadata : ExceptionMetadata = {
        responseCode: 500 // general interal server error
    };

    public constructor(message : string, code ? : number)
    {
        super(message);
        this.code = code || this.code;
    }

    public setMetadata(metadata : ExceptionMetadata)
    {
        this.metadata = metadata;
    }

    public toString()
    {
        return this.name + (this.code ? ' [' + this.code + ']' : '') + ': ' + this.message;
    }

}

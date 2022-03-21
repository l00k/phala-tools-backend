/* istanbul ignore file */
import { Exception, ExceptionMetadata } from '@inti5/utils/Exception';
import { ValidationResult } from './ValidationResult';


export class ValidationException
    extends Exception
{

    public name : string = 'ValidationException';

    public details : ValidationResult;

    public metadata : ExceptionMetadata = {
        responseCode: 422
    };

    constructor(message : string, code ? : number, details? : ValidationResult)
    {
        super(message, code);
        this.details = details || this.details;
    }

}

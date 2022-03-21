import { ValidationError, ValidationErrorMap } from './def';


export class ValidationResult
{

    public valid : boolean = true;

    public errors : ValidationErrorMap = {};

}

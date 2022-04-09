import { ValidationException } from '@inti5/validator';
import { ValidationResult } from 'core/validator/ValidationResult';

export class OwnershipException
    extends ValidationException
{
    
    public constructor (
        message : string = 'Ownership verificaiton failed',
        code : number = 1649520720489,
        details? : ValidationResult
    )
    {
        super(message, code, details);
    }
    
}

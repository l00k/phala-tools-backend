import { ValidationException } from '@inti5/validator';
import { ValidationResult } from '@inti5/validator/ValidationResult';

export class EntityNotExistException
    extends ValidationException
{
    
    public constructor (
        message : string = 'Entity not exist',
        code : number = 1649806927410,
        details? : ValidationResult
    )
    {
        super(message, code, details);
    }
    
}

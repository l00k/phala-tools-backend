import { Assert } from '@inti5/validator/Object';

export class Modifiers
{
    
    @Assert({ type: 'boolean' })
    public distinctOwners : boolean = false;
    
}

import * as ORM from '@mikro-orm/core';


export class DecimalType
    extends ORM.Type<number, string | null | undefined>
{
    
    public convertToDatabaseValue (value)
    {
        if (!value) {
            return '0';
        }
        return value.toString();
    }
    
    public convertToJSValue (value)
    {
        if (!value) {
            return 0;
        }
        return parseFloat(value);
    }
    
}

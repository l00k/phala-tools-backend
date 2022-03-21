import * as ORM from '@mikro-orm/core';
import Decimal from 'decimal.js';


export class DecimalExtType
    extends ORM.Type<Decimal, string | null | undefined>
{

    public convertToDatabaseValue(value)
    {
        if (!value) {
            return '0';
        }
        return value.toString();
    }

    public convertToJSValue(value)
    {
        if (!value) {
            return new Decimal(0);
        }
        return new Decimal(value);
    }

}

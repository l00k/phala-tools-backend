import * as ORM from '@mikro-orm/core';


export class BigIntType
    extends ORM.Type<BigInt, string | null | undefined>
{

    public convertToDatabaseValue(value)
    {
        if (!value) {
            return value;
        }
        return '' + value;
    }

    public convertToJSValue(value)
    {
        if (!value) {
            return BigInt(0);
        }
        return BigInt(value);
    }

    public getColumnType(prop, platform)
    {
        return 'DECIMAL(36,0)';
    }

}

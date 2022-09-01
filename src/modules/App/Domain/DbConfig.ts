import * as ORM from '@mikro-orm/core';

export class ColumnType
{
    
    public static readonly PRICE : ORM.PropertyOptions<any> = {
        type: ORM.FloatType,
    };
    
    public static readonly PERCENT : ORM.PropertyOptions<any> = {
        type: ORM.FloatType,
    };
    
    public static readonly BALANCE : ORM.PropertyOptions<any> = {
        type: ORM.DoubleType
    };
    
    public static readonly ENC_BIG_DECIMAL : ORM.PropertyOptions<any> = {
        type: ORM.DoubleType
    };
    
}

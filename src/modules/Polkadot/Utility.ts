export class Utility
{
    
    protected static readonly PERCENT_DECIMALS = Math.pow(10, -6);
    
    
    public static parseRawPercent (percent : number) : number
    {
        return percent * this.PERCENT_DECIMALS;
    }
    
}

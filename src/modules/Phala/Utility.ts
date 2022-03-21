export class Utility
{
    
    protected static readonly V_FACTOR = Math.pow(2, -64);
    protected static readonly TOKEN_DECIMALS = Math.pow(10, -12);
    
    
    public static decodeBigNumber (v : number) : number
    {
        return v * Utility.V_FACTOR;
    }
    
    public static parseRawAmount (amount : number) : number
    {
        return amount * this.TOKEN_DECIMALS;
    }
    
}

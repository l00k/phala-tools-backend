import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';

export class Utility
{
    
    protected static readonly PERCENT_DECIMALS = Math.pow(10, -6);
    
    
    public static parseRawPercent (percent : number) : number
    {
        return percent * this.PERCENT_DECIMALS;
    }
    
    public static isAddress (
        address : string,
        prefix? : number
    ) : boolean
    {
        try {
            const encoded = encodeAddress(
                isHex(address)
                    ? hexToU8a(address)
                    : decodeAddress(address),
                prefix
            );
            
            return prefix
                ? encoded == address
                : true;
        }
        catch (error) {
            return false;
        }
    }
    
}

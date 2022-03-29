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
        if (typeof address != 'string') {
            return false;
        }
        
        if (!address.match(/^[a-zA-Z0-9]{48}$/)) {
            return false;
        }
    
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

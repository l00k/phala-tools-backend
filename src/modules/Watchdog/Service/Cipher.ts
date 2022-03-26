import crypto, { CipherGCMTypes } from 'crypto';


type CipherConfig = {
    encyptionMethod : string,
    numAuthTagBytes? : number,
    numIvBytes? : number,
};

export class Cipher
{
    
    protected static readonly ALGORITHM : CipherGCMTypes = 'aes-256-gcm';
    
    protected static readonly NUM_AUTH_TAG_BYTES : number = 16;
    
    protected static readonly NUM_IV_BYTES : number = 16;
    
    protected _key : string;
    
    
    public constructor (key : string)
    {
        this._key = key.substring(0, 32).padEnd(32, ' ');
    }
    
    public encrypt (msg : string)
    {
        const iv = crypto.randomBytes(Cipher.NUM_IV_BYTES);
        
        const cipher = crypto.createCipheriv(
            Cipher.ALGORITHM,
            Buffer.from(this._key.padEnd(32, ' ')),
            iv,
            { authTagLength: Cipher.NUM_AUTH_TAG_BYTES }
        );
        
        return [
            iv.toString('base64'),
            cipher.update(msg, 'utf8', 'base64'),
            cipher.final('base64'),
            cipher.getAuthTag().toString('base64')
        ].join('');
    }
    
    public decrypt (cipherText : string)
    {
        const authTagCharLength : number = Cipher.NUM_AUTH_TAG_BYTES * 3 / 2;
        const ivCharLength : number = Cipher.NUM_IV_BYTES * 3 / 2;
        
        const authTag = Buffer.from(cipherText.slice(-authTagCharLength), 'base64');
        const iv = Buffer.from(cipherText.slice(0, ivCharLength), 'base64');
        const encryptedMessage = Buffer.from(cipherText.slice(ivCharLength, -authTagCharLength), 'base64');
        
        const decipher = crypto.createDecipheriv(
            Cipher.ALGORITHM,
            Buffer.from(this._key.padEnd(32, ' ')),
            iv,
            { authTagLength: Cipher.NUM_AUTH_TAG_BYTES }
        );
        
        const result = [];
        
        result.push(decipher.update(encryptedMessage));
        decipher.setAuthTag(authTag);
        result.push(decipher.final());
        
        return result.join('');
    }
    
}

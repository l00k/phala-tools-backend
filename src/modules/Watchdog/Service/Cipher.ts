import crypto, { CipherGCMTypes } from 'crypto';


type CipherConfig = {
    encyptionMethod : string,
    numAuthTagBytes? : number,
    numIvBytes? : number,
};

export class Cipher
{
    
    protected static readonly algorithm : CipherGCMTypes = 'aes-256-gcm';
    
    protected static readonly numAuthTagBytes : number = 16;
    
    protected static readonly numIvBytes : number = 16;
    
    protected key : string;
    
    
    public constructor (key : string)
    {
        this.key = key.substring(0, 32).padEnd(32, ' ');
    }
    
    public encrypt (msg : string)
    {
        const iv = crypto.randomBytes(Cipher.numIvBytes);
        
        const cipher = crypto.createCipheriv(
            Cipher.algorithm,
            Buffer.from(this.key.padEnd(32, ' ')),
            iv,
            { authTagLength: Cipher.numAuthTagBytes }
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
        const authTagCharLength : number = Cipher.numAuthTagBytes * 3 / 2;
        const ivCharLength : number = Cipher.numIvBytes * 3 / 2;
        
        const authTag = Buffer.from(cipherText.slice(-authTagCharLength), 'base64');
        const iv = Buffer.from(cipherText.slice(0, ivCharLength), 'base64');
        const encryptedMessage = Buffer.from(cipherText.slice(ivCharLength, -authTagCharLength), 'base64');
        
        const decipher = crypto.createDecipheriv(
            Cipher.algorithm,
            Buffer.from(this.key.padEnd(32, ' ')),
            iv,
            { authTagLength: Cipher.numAuthTagBytes }
        );
        
        const result = [];
        
        result.push(decipher.update(encryptedMessage));
        decipher.setAuthTag(authTag);
        result.push(decipher.final());
        
        return result.join('');
    }
    
}

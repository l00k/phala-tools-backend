import { Assert } from '@inti5/validator/Object';


export class TelegramLoginDto
{
    
    @Assert({
        presence: true,
        numericality: {
            onlyInteger: true,
        }
    })
    public id : number;
    
    @Assert({
        presence: true,
    })
    public firstName : string;
    
    @Assert()
    public lastName : string;
    
    @Assert({
        presence: true,
    })
    public username : string;
    
    @Assert({
        presence: true,
    })
    public photoUrl : string;
    
    @Assert({
        presence: true,
    })
    public authDate : number;
    
    @Assert({
        presence: true,
    })
    public hash : string;
    
}

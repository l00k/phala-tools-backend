import { Assert } from '@inti5/validator/Object';


export class TelegramLoginDto
{
    
    @Assert({
        presence: true,
        numericality: {
            onlyInteger: true,
        }
    })
    public id : string;
    
    @Assert({
        presence: true,
    })
    public firstName : string;
    
    @Assert({
        presence: true,
    })
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
    public authDate : string;
    
    @Assert({
        presence: true,
    })
    public hash : string;
    
}

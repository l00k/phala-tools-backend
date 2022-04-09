import { Assert } from '@inti5/validator/Object';


export class DiscordLoginDto
{
    
    @Assert({
        presence: true,
        format: /^[0-9a-zA-Z]+$/,
    })
    public code : string;
    
}

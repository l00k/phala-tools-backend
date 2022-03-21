import axios from 'axios';
import { Config } from '@inti5/configuration';


export class UptimeNotifier
{

    @Config('module.uptimeNotifier.heartbeatUrl')
    protected heartbeatUrl : string;

    public async notify(): Promise<boolean>
    {
        const response = await axios.get(this.heartbeatUrl);
        return response.status === 200;
    }

}

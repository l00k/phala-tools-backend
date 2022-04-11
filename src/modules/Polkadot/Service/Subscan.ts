import { InitializeSymbol, Inject, Singleton } from '@inti5/object-manager';
import { Config } from '@inti5/configuration';
import { Logger } from '@inti5/utils/Logger';
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { zipObject } from 'lodash';



type SubscanResponse = {
    code: number,
    data: {
        count: number,
        extrinsics?: any[],
        events?: any[],
    },
    message: string,
}

type EventFilter = {
    module: string,
    call: string,
    page?: number,
    row?: number,
    block_range? : string,
    address? : string,
};

type Event = {
    event_idx: number,
    event_index: string,
    block_num: number,
    block_timestamp: number,
    module_id: string,
    event_id: string,
    extrinsic_hash: string,
    extrinsic_idx: number,
    finalized: boolean,
    params: any[],
};

type ExtrinsicFilter = {
    module: string,
    call: string,
    page?: number,
    row?: number,
    signed? : 'signed' | 'not_singned',
    block_range? : string,
    address? : string,
    success? : boolean,
};

type Extrinsic = {
    account_id: string,
    account_index: string,
    account_display?: {
        account_index: string,
        address: string,
        display: string,
        identity: boolean,
        judgements: string,
        parent: string,
    },
    block_num: number,
    block_timestamp: number,
    call_module: string,
    call_module_function: string,
    extrinsic_hash: string,
    extrinsic_index: string,
    fee: string,
    finalized: boolean,
    from_hex: string,
    nonce: number,
    params: {
        [key : string]: any
    },
    signature: string,
    success: boolean,
};


const sleep = (ms : number) => new Promise(resolve => setTimeout(resolve, ms));


@Singleton()
export class Subscan
{
    
    protected static readonly SERVICE_NAME : string = 'PolkadotSubscan';
    
    
    @Config('modules.polkadot.subscan.baseUrl')
    protected _subscanBaseUrl : string;
    
    @Inject({ ctorArgs: [Subscan.SERVICE_NAME] })
    protected _logger : Logger;
    
    protected _axios : AxiosInstance;
    
    
    public [InitializeSymbol] ()
    {
        this._axios = Axios.create({
            baseURL: this._subscanBaseUrl,
        });
    }
    
    public async get(url : string, config? : AxiosRequestConfig): Promise<AxiosResponse<SubscanResponse>>
    {
        return <any> this._axios.get(url, config);
    }
    
    public async post(url : string, data? : any, config? : AxiosRequestConfig): Promise<AxiosResponse<SubscanResponse>>
    {
        return <any> this._axios.post(url, data, config);
    }
    
    public async *getExtrinsics(filters : ExtrinsicFilter, ascendingOrder : boolean = true): AsyncGenerator<Extrinsic[], void, void>
    {
        filters = {
            module: '',
            call: '',
            page: 0,
            row: 100,
            ...filters
        };
        
        // first execution to get count
        const { status, data } = await this.post('scan/extrinsics', filters);
        
        const totalCount : number = data.data.count;
        const pagesNum = Math.ceil(totalCount / filters.row);
        if (pagesNum == 0) {
            return;
        }
        
        if (ascendingOrder) {
            filters.page = pagesNum - 1;
        }
        
        let counter = 0;
        
        let result : SubscanResponse;
        while (true) {
            result = null;
        
            try {
                const { status, data } = await this.post('scan/extrinsics', filters);
                if (status === 200) {
                    result = data;
                }
            }
            catch (e) {
                this._logger.log('Request failed. Retrying in 1s');
                await sleep(1000);
                continue;
            }
            
            if (!result.data.extrinsics) {
                break;
            }
            
            const extrinsics = result.data.extrinsics
                .map(extrinsic => {
                    const paramsRaw = extrinsic.params
                        ? JSON.parse(extrinsic.params)
                        : [];
                    extrinsic.params = zipObject(
                        paramsRaw.map(param => param.name),
                        paramsRaw.map(param => param.value),
                    );
                    
                    return extrinsic;
                })
                .sort((e1, e2) => e1.extrinsic_index <= e2.extrinsic_index ? -1 : 1);
            
            yield extrinsics;
            
            counter += extrinsics.length;
            if (counter == totalCount) {
                break;
            }
            
            if (ascendingOrder) {
                --filters.page;
            }
            else {
                ++filters.page;
            }
            
            const percent = (1 - filters.page / pagesNum) * 100;
            this._logger.log('Requesting next page. Progres: ', `${percent.toFixed(1)}%`);
        }
    }
    
    public async *getEvents(filters : EventFilter, ascendingOrder : boolean = true): AsyncGenerator<Event[], void, void>
    {
        filters = {
            module: '',
            call: '',
            page: 0,
            row: 100,
            ...filters
        };
        
        // first execution to get count
        const { status, data } = await this.post('scan/events', filters);
        
        const totalCount : number = data.data.count;
        const pagesNum = Math.ceil(totalCount / filters.row);
        if (pagesNum == 0) {
            return;
        }
        
        if (ascendingOrder) {
            filters.page = pagesNum - 1;
        }
        
        let counter = 0;
        
        let result : SubscanResponse;
        while (true) {
            result = null;
        
            try {
                const { status, data } = await this.post('scan/events', filters);
                if (status === 200) {
                    result = data;
                }
            }
            catch (e) {
                this._logger.log('Request failed. Retrying in 1s');
                await sleep(1000);
                continue;
            }
            
            if (!result.data.events) {
                break;
            }
            
            const events = result.data.events
                .map(event => {
                    const paramsRaw = event.params
                        ? JSON.parse(event.params)
                        : [];
                    event.params = paramsRaw.map(p => p.value);
                    
                    return event;
                })
                .sort((e1, e2) => {
                    return e1.extrinsic_idx <= e2.extrinsic_idx
                        ? (e1.event_idx <= e2.event_idx ? -1 : 1)
                        : 1;
                })
            
            yield events;
            
            counter += events.length;
            if (counter == totalCount) {
                break;
            }
            
            if (ascendingOrder) {
                --filters.page;
            }
            else {
                ++filters.page;
            }
            
            const percent = (1 - filters.page / pagesNum) * 100;
            this._logger.log('Requesting next page. Progres: ', `${percent.toFixed(1)}%`);
        }
    }
    
}

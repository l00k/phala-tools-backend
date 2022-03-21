import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';
import { Config } from '@inti5/configuration';
import { InitializeSymbol } from '../object-manager';


export type ClientConfig = {
    baseURL : string,
    axiosConfig? : AxiosRequestConfig
}


export class HttpClient
{
    
    @Config('api.client')
    protected config : ClientConfig;
    
    protected axios : AxiosInstance;
    
    
    public [InitializeSymbol] ()
    {
        const axiosConfig : AxiosRequestConfig = {
            withCredentials: false,
            ...(this.config.axiosConfig ?? {}),
            baseURL: this.config.baseURL,
        };
        this.axios = axios.create(axiosConfig);
        
        this.axios.interceptors.request
            .use(config => {
                config.paramsSerializer = params => {
                    return qs.stringify(params, {
                        arrayFormat: 'brackets',
                        encode: true
                    });
                };
                
                return config;
            });
    }
    
    public async request (method : string, ...args : any[]): Promise<AxiosResponse>
    {
        return this.axios[method](...args);
    }
    
    public async head (url : string, config ? : AxiosRequestConfig): Promise<AxiosResponse>
    {
        return this.request('head', url, config);
    }
    
    public async options (url : string, config ? : AxiosRequestConfig): Promise<AxiosResponse>
    {
        return this.request('options', url, config);
    }
    
    public async get (url : string, config ? : AxiosRequestConfig): Promise<AxiosResponse>
    {
        return this.request('get', url, config);
    }
    
    public async post (url : string, data? : any, config ? : AxiosRequestConfig): Promise<AxiosResponse>
    {
        return this.request('post', url, data, config);
    }
    
    public async put (url : string, data? : any, config ? : AxiosRequestConfig): Promise<AxiosResponse>
    {
        return this.request('put', url, data, config);
    }
    
    public async patch (url : string, data? : any, config ? : AxiosRequestConfig): Promise<AxiosResponse>
    {
        return this.request('patch', url, data, config);
    }
    
    public async delete (url : string, config ? : AxiosRequestConfig): Promise<AxiosResponse>
    {
        return this.request('delete', url, config);
    }
    
}

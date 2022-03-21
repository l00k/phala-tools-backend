export class InjectionDescription
{

    public configPath? : string;
    public defaultValue? : any;

}

export type InjectOptions = Partial<InjectionDescription>;

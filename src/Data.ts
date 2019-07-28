export default class Data {
    
    private m_constructorName: string;
    public get constructorName(): string {
        return this.m_constructorName;
    }
    
    private m_value: any;
    public get value(): any {
        return this.m_value;
    }
    
    private m_context: { [index: string]: any };
    public get context(): { [index: string]: any } {
        return this.m_context;
    }
    
    public constructor(constructorName: string, data: any, context?: any) {
        this.m_constructorName = constructorName;
        this.m_value = data;
        this.m_context = context;
    }
    
    public get(index: string): Data {
        const data = this.m_value[index] as Data;
        return new Data(data.m_constructorName, data.m_value, this.m_context || {});
    }
    
}
type Optional<T> = T | undefined;

export default class Data {
    
    private m_constructorName: string;
    public get constructorName(): string {
        return this.m_constructorName;
    }
    
    private m_value: any;
    public get value(): any {
        return this.m_value;
    }
    
    public constructor(constructorName: string, value: any) {
        this.m_constructorName = constructorName;
        this.m_value = value;
    }
    
}
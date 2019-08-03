import { Optional } from './Optional';

export default class Data {
    
    private m_identifier: string;
    public get identifier(): string {
        return this.m_identifier;
    }
    
    private m_value: any;
    public get value(): any {
        return this.m_value;
    }
    
    public constructor(identifier: string, value: any) {
        this.m_identifier = identifier;
        this.m_value = value;
    }
    
}
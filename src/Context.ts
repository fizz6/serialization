export default class Context {
    
    private m_namespaces: Map<string, any> = new Map();
    
    public get(name: string): any {
        return this.m_namespaces.get(name);
    }
    
    public set(name: string, value: any): void {
        this.m_namespaces.set(name, value);
    }
    
}
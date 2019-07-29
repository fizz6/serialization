export default class Context {
    
    private m_namespaces: Map<string, any> = new Map();
    
    public get(name: string): any {
        let namespace = this.m_namespaces.get(name);
        if (namespace === undefined) {
            namespace = {};
            this.m_namespaces.set(name, namespace);
        }
        return namespace;
    }
    
}
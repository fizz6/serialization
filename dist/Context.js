"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Context {
    constructor() {
        this.m_namespaces = new Map();
    }
    get(name) {
        let namespace = this.m_namespaces.get(name);
        if (namespace === undefined) {
            namespace = {};
            this.m_namespaces.set(name, namespace);
        }
        return namespace;
    }
}
exports.default = Context;

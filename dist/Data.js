"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Data {
    get constructorName() {
        return this.m_constructorName;
    }
    get value() {
        return this.m_value;
    }
    get context() {
        return this.m_context;
    }
    constructor(constructorName, data, context) {
        this.m_constructorName = constructorName;
        this.m_value = data;
        this.m_context = context;
    }
    get(index) {
        const data = this.m_value[index];
        return new Data(data.m_constructorName, data.m_value, this.m_context || {});
    }
}
exports.default = Data;

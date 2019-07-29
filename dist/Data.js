"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Data {
    get constructorName() {
        return this.m_constructorName;
    }
    get value() {
        return this.m_value;
    }
    constructor(constructorName, value) {
        this.m_constructorName = constructorName;
        this.m_value = value;
    }
}
exports.default = Data;

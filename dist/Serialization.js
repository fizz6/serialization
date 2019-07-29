"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Data_1 = require("./Data");
const Context_1 = require("./Context");
class Serialization {
    static Prototypes(constructor) {
        return Serialization.PrototypesHelper(constructor, new Set());
    }
    static PrototypesHelper(constructor, out) {
        out.add(constructor);
        const prototypeConstructor = constructor.prototype.__proto__.constructor;
        if (prototypeConstructor === Object) {
            return out;
        }
        return Serialization.PrototypesHelper(prototypeConstructor, out);
    }
    static Serializable(constructor) {
        if (Serialization.m_constructors.has(constructor.name)) {
            throw new Error(`'${constructor.name}' is already serializable`);
            return;
        }
        Serialization.m_constructors.set(constructor.name, constructor);
    }
    static Class(constructor) {
        if (Serialization.m_constructors.has(constructor.name)) {
            throw new Error(`'${constructor.name}' is already serializable`);
            return;
        }
        let instance;
        try {
            instance = new constructor();
        }
        catch (_a) {
            throw new Error(`'${constructor.name}' must have a default constructor in order to be serializable`);
        }
        const prototypes = Serialization.Prototypes(constructor);
        const propertyNames = Array.from(prototypes)
            .reduce((state, prototype) => {
            if (prototype === constructor) {
                return state;
            }
            let instance;
            try {
                instance = new prototype();
            }
            catch (_a) {
                throw new Error(`'${prototype.name}' must have a default constructor in order to be serializable`);
            }
            const prototypePropertyNames = Object.getOwnPropertyNames(instance);
            if (prototypePropertyNames !== undefined) {
                prototypePropertyNames.forEach((propertyName) => state.delete(propertyName));
            }
            return state;
        }, new Set(Object.getOwnPropertyNames(instance)));
        Serialization.m_constructors.set(constructor.name, constructor);
        Serialization.m_propertyNames.set(constructor, propertyNames);
        Serialization.m_prototypes.set(constructor, prototypes);
    }
    static Property(target, propertyName) {
        const constructor = target.constructor;
        let propertyNames = Serialization.m_propertyNames.get(constructor);
        if (propertyNames === undefined) {
            propertyNames = new Set();
            const prototypes = Serialization.Prototypes(constructor);
            Serialization.m_constructors.set(constructor.name, constructor);
            Serialization.m_propertyNames.set(constructor, propertyNames);
            Serialization.m_prototypes.set(constructor, prototypes);
        }
        propertyNames.add(propertyName);
    }
    static Serialize(target) {
        const constructor = target.constructor;
        if (!(target instanceof Object)) {
            return new Data_1.default(constructor.name, target);
        }
        if (target instanceof Array) {
            const value = target
                .map((item) => Serialization.Serialize(item));
            return new Data_1.default(constructor.name, value);
        }
        const prototypes = Serialization.m_prototypes.get(constructor);
        if (prototypes === undefined) {
            if (target.serialize === undefined) {
                return new Data_1.default(constructor.name, undefined);
            }
            const value = target.serialize();
            return new Data_1.default(constructor.name, value);
        }
        let value = Array.from(prototypes)
            .reverse()
            .reduce((state, prototype) => {
            if (Serialization.m_constructors.has(prototype.name)) {
                const propertyNames = Serialization.m_propertyNames.get(prototype);
                if (propertyNames === undefined) {
                    return state;
                }
                propertyNames
                    .forEach((propertyName) => {
                    const property = target[propertyName];
                    state[propertyName] = Serialization.Serialize(property);
                });
            }
            return state;
        }, {});
        if (target.serialize !== undefined) {
            value = target.serialize(value);
        }
        const data = new Data_1.default(constructor.name, value);
        return data;
    }
    static Deserialize(data, context = new Context_1.default()) {
        const constructorName = data.constructorName;
        if (Serialization.m_baseTypeConstructorNames.has(constructorName)) {
            return data.value;
        }
        if (constructorName === "Array") {
            return data.value
                .map((item) => Serialization.Deserialize(item));
        }
        const constructor = Serialization.m_constructors.get(constructorName);
        if (constructor === undefined) {
            throw new Error(`'${constructorName}' cannot be deserialized`);
        }
        let instance;
        try {
            instance = new constructor();
        }
        catch (_a) {
            throw new Error(`'${constructor.name}' must have a default constructor in order to be serializable`);
        }
        const prototypes = Serialization.m_prototypes.get(constructor);
        if (prototypes === undefined) {
            throw new Error(`'${constructor.name}' cannot be deserialized`);
        }
        Array.from(prototypes)
            .reverse()
            .forEach((prototype) => {
            if (Serialization.m_constructors.has(prototype.name)) {
                const propertyNames = Serialization.m_propertyNames.get(prototype);
                if (propertyNames === undefined) {
                    return;
                }
                propertyNames
                    .forEach((propertyName) => {
                    instance[propertyName] = Serialization.Deserialize(data.value[propertyName], context);
                });
            }
        });
        if (instance.deserialize !== undefined) {
            instance.deserialize(data.value, context);
        }
        return instance;
    }
}
Serialization.m_constructors = new Map();
Serialization.m_propertyNames = new Map();
Serialization.m_prototypes = new Map();
Serialization.m_baseTypeConstructorNames = new Set(["Boolean", "Number", "String", "Symbol", "Null", "Undefined"]);
exports.default = Serialization;

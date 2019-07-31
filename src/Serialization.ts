import Context from './Context';
import Data from './Data';
import { Optional } from './Optional';

interface Constructor {
    new (...args: any[]): Object;
    namespace?: string;
}

class Serialization {
    
    private static m_constructors: Map<string, Constructor> = new Map();
    
    private static m_propertyNames: Map<Constructor, Set<string>> = new Map<Constructor, Set<string>>();
    
    private static m_prototypes: Map<Constructor, Set<Constructor>> = new Map();
    
    private static m_baseTypeConstructorNames: Set<string> = new Set([ "Boolean", "Number", "String", "Symbol", "Null", "Undefined" ]);
    
    public static Prototypes(constructor: Constructor): Set<Constructor> {
        return Serialization.PrototypesHelper(constructor, new Set());
    }
    
    private static PrototypesHelper(constructor: Constructor, out: Set<Constructor>): Set<Constructor> {
        out.add(constructor);
        
        const prototypeConstructor = constructor.prototype.__proto__.constructor;
        if (prototypeConstructor === Object) {
            return out;
        }
        
        return Serialization.PrototypesHelper(prototypeConstructor, out);
    }
    
    private static Namespace(constructor: Constructor): string {
        return constructor.namespace === undefined
            ? constructor.name
            : `${constructor.namespace}.${constructor.name}`;
    }
    
    public static Register(constructor: Constructor): void {
        const constructorName = Serialization.Namespace(constructor);
        
        if (Serialization.m_constructors.has(constructorName)) {
            throw new Error(`'${constructorName}' is already serializable`);
        }
        
        const prototypes = Serialization.Prototypes(constructor);
        
        Serialization.m_constructors.set(constructorName, constructor);
        Serialization.m_propertyNames.set(constructor, new Set());
        Serialization.m_prototypes.set(constructor, prototypes);
    }
    
    public static Class(constructor: Constructor): void {
        const constructorName = Serialization.Namespace(constructor);
        
        if (Serialization.m_constructors.has(constructorName)) {
            throw new Error(`'${constructorName}' is already serializable`);
        }
        
        let instance: Object;
        try {
            instance = new constructor();
        }
        catch {
            throw new Error(`'${constructorName}' must have a default constructor in order to be serializable`);
        }
        
        const prototypes = Serialization.Prototypes(constructor);
        
        const propertyNames = Array.from(prototypes)
            .reduce(
                (state: Set<string>, prototype: Constructor): Set<string> => {
                    if (prototype === constructor) {
                        return state;
                    }
                    
                    let instance: Object;
                    try {
                        instance = new prototype();
                    }
                    catch {
                        throw new Error(`'${prototype.name}' must have a default constructor in order to be serializable`);
                    }
                    
                    const prototypePropertyNames = Object.getOwnPropertyNames(instance);
                    if (prototypePropertyNames !== undefined) {
                        prototypePropertyNames.forEach((propertyName: string): boolean => state.delete(propertyName));
                    }
                    
                    return state;
                },
                new Set(Object.getOwnPropertyNames(instance))
            );
        
        Serialization.m_constructors.set(constructorName, constructor);
        Serialization.m_propertyNames.set(constructor, propertyNames);
        Serialization.m_prototypes.set(constructor, prototypes);
    }
    
    public static Property(target: Object, propertyName: string): void {
        const constructor = target.constructor as Constructor;
        const constructorName = Serialization.Namespace(constructor);
        
        let propertyNames = Serialization.m_propertyNames.get(constructor);
        if (propertyNames === undefined) {
            propertyNames = new Set();
            const prototypes = Serialization.Prototypes(constructor);
            Serialization.m_constructors.set(constructorName, constructor);
            Serialization.m_propertyNames.set(constructor, propertyNames);
            Serialization.m_prototypes.set(constructor, prototypes);
        }
        
        propertyNames.add(propertyName);
    }
    
    public static Serialize(target: any): Data {
        const constructor = target.constructor as Constructor;
        const constructorName = Serialization.Namespace(constructor);
        
        if (!(target instanceof Object)) {
            return new Data(constructorName, target);
        }
        
        if (target instanceof Array) {
            const value = (target as Array<any>)
                .map((item: any): Data  => Serialization.Serialize(item));
            return new Data(constructorName, value);
        }
        
        const prototypes = Serialization.m_prototypes.get(constructor);
        if (prototypes === undefined) {
            return new Data(constructorName, undefined);
        }
        
        let value = Array.from(prototypes)
            .reverse()
            .reduce(
                (state: { [propertyName: string]: Data }, prototype: Constructor): { [propertyName: string]: Data } => {
                    const prototypeName = Serialization.Namespace(prototype);
                    if (Serialization.m_constructors.has(prototypeName)) {
                        const propertyNames = Serialization.m_propertyNames.get(prototype);
                        if (propertyNames === undefined) {
                            return state;
                        }
                        
                        propertyNames
                            .forEach(
                                (propertyName: string): void => {
                                    const property = target[propertyName];
                                    state[propertyName] = Serialization.Serialize(property);
                                }
                            );
                    }
                    
                    return state;
                },
                {}
            );
        
        const data = new Data(constructorName, value);
        
        if (target.serialize !== undefined) {
            target.serialize(data);
        }
        
        return data;
    }
    
    public static Deserialize(data: Data, context: Context = new Context()): Object {
        const constructorName = data.constructorName;
        
        if (Serialization.m_baseTypeConstructorNames.has(constructorName)) {
            return data.value;
        }
        
        if (constructorName === "Array") {
            return (data.value as Array<any>)
                .map((data: Data): Object => Serialization.Deserialize(data));
        }
        
        const constructor = Serialization.m_constructors.get(constructorName);
        if (constructor === undefined) {
            throw new Error(`'${constructorName}' cannot be deserialized`);
        }
        
        let instance: Object;
        try {
            instance = new constructor();
        }
        catch {
            throw new Error(`'${constructorName}' must have a default constructor in order to be serializable`);
        }
        
        const prototypes = Serialization.m_prototypes.get(constructor);
        if (prototypes === undefined) {
            throw new Error(`'${constructorName}' cannot be deserialized`);
        }
        
        Array.from(prototypes)
            .reverse()
            .forEach(
                (prototype: Constructor): void => {
                    if (Serialization.m_constructors.has(prototype.name)) {
                        const propertyNames = Serialization.m_propertyNames.get(prototype);
                        if (propertyNames === undefined) {
                            return;
                        }
                        
                        propertyNames
                            .forEach(
                                (propertyName: string): void => {
                                    (instance as any)[propertyName] = Serialization.Deserialize(data.value[propertyName], context);
                                }
                            );
                    }
                }
            );
        
        if ((instance as any).deserialize !== undefined) {
            (instance as any).deserialize(data, context);
        }
        
        return instance;
    }
    
}

const store = global === undefined
    ? (window as any)
    : (global as any);
    
if (store.fizz6 === undefined) {
    store.fizz6 = {};
}

if (store.fizz6.serialization === undefined) {
    store.fizz6.serialization = Serialization;
}

export default store.fizz6.serialization;

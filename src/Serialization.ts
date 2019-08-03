import { Namespace, Singleton } from '@fizz6/utility';
import { Type, Property, Field } from '@fizz6/reflection';
import Context from './Context';
import Data from './Data';

/**
 * TODO:
 * Entity deserialization shouldn't ALWAYS randomize Ids.
 * This will end up being a nightmare when merging Scenes.
 */

interface Constructor {
    new (...args: any[]): Object;
}

class Serialization {
    
    private static m_constructors: Map<string, Constructor> = new Map();
    
    private static m_fields: Map<Constructor, Set<Field>> = new Map();
    
    public static register(constructor: Constructor): void {
        Serialization.initialize(constructor);
    }
    
    public static type(constructor: Constructor): void {
        const type = Type.of(constructor);
        const fields = Serialization.initialize(constructor);
        type.fields.forEach((field: Field): Set<Field> => fields.add(field));
    }
    
    public static field(instance: Object, propertyName: string): void {
        const constructor = instance.constructor as Constructor;
        const identifier = Namespace.resolve(constructor);
        const type = Type.of(constructor);
        
        if (!Serialization.m_constructors.has(identifier)) {
            Serialization.initialize(constructor);
        }
        
        const fields = Serialization.m_fields.get(constructor);
        if (fields === undefined) {
            return;
        }
        
        const field = type.fields.get(propertyName);
        if (field === undefined) {
            return;
        }
        
        fields.add(field);
    }
    
    private static initialize(constructor: Constructor): Set<Field> {
        const identifier = Namespace.resolve(constructor);
        if (Serialization.m_constructors.has(identifier)) {
            throw new Error();
        }
        
        const type = Type.of(constructor);
        const fields = Array.from(type.prototypes)
            .reduce(
                (state: Set<Field>, prototype: Constructor): Set<Field> => {
                    if (prototype === constructor) {
                        return state;
                    }
                    
                    const properties = Serialization.m_fields.get(prototype);
                    if (properties === undefined) {
                        return state;
                    }
                    
                    properties.forEach((field: Field): Set<Field> => state.add(field));
                    return state;
                },
                new Set()
            );
        
        Serialization.m_constructors.set(identifier, constructor);
        Serialization.m_fields.set(constructor, fields);
        return fields;
    }
    
    public static serialize(target: any): Data {
        const constructor = target.constructor as Constructor;
        const identifier = Namespace.resolve(constructor);
        
        if (!Serialization.m_constructors.has(identifier)) {
            if (target instanceof Array) {
                const value = target
                    .map((target: any): Data => Serialization.serialize(target));
                return new Data(identifier, value);
            }
            
            if (target instanceof Object) {
                const value = Object.keys(target)
                    .reduce(
                        (state: { [ index: string ]: Data }, index: any): { [ index: string ]: Data } => {
                            const value = target[index];
                            state[index] = Serialization.serialize(value);
                            return state;
                        },
                        {}
                    );
                return new Data(identifier, value);
            }
            
            return new Data(identifier, target);
        }
        
        const fields = Serialization.m_fields.get(constructor);
        if (fields === undefined) {
            throw new Error();
        }
        
        const value = Array.from(fields)
            .reduce(
                (state: { [ index: string ]: Data }, field: Field): { [ index: string ]: Data } => {
                    const value = field.get(target);
                    state[field.name] = Serialization.serialize(value);
                    return state;
                },
                {}
            );
        
        const data = new Data(identifier, value);
        if (target.serialize !== undefined) {
            target.serialize(data);
        }
        
        return data;
    }
    
    public static deserialize(object: any, context: Context = new Context()): Object {
        const data = object instanceof Data
            ? object as Data
            : Object.setPrototypeOf(object, Data.prototype) as Data;
        const identifier = data.identifier;
        
        const constructor = Serialization.m_constructors.get(identifier);
        if (constructor === undefined) {
            if (Type.values.has(identifier)) {
                return data.value;
            }
            
            if (identifier === "Array") {
                return data.value
                    .map((data: Data): Object => Serialization.deserialize(data, context));
            }
            
            if (identifier === "Object") {
                return Object.keys(data.value as Object)
                    .reduce(
                        (state: { [ index: string ]: Object }, index: any): { [ index: string ]: Object } => {
                            const value = data.value[index];
                            state[index] = Serialization.deserialize(value, context);
                            return state;
                        },
                        {}
                    );
            }
            
            return Object.keys(data.value as Object)
                    .reduce(
                        (state: { [ index: string ]: Object }, index: any): { [ index: string ]: Object } => {
                            const value = data.value[index];
                            state[index] = Serialization.deserialize(value, context);
                            return state;
                        },
                        {}
                    );
        }
        
        let instance: Object;
        try {
            instance = new constructor();
        }
        catch {
            instance = Object.create(constructor.prototype);
        }
        
        Array.from(Serialization.m_fields.values())
            .reduce(
                (state: Object, fields: Set<Field>): Object => {
                    fields.forEach(
                        (field: Field): void => {
                            const value = Serialization.deserialize(field.get(data.value), context)
                            field.set(state, value);
                        }
                    );
                    return state;
                },
                instance
            );
            
        const target = instance as any;
        if (target.deserialize !== undefined) {
            target.deserialize(data, context);
        }
        
        return target;
    }
}

export default Singleton.of(Serialization);
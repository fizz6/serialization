import Data from './Data';

type Optional<T> = T | undefined;

type Constructor = new (...args: any[]) => Object;

export default class Serialization {
    
    private static m_constructors: Map<string, Constructor> = new Map();
    
    private static m_propertyNames: Map<Constructor, Set<string>> = new Map<Constructor, Set<string>>();
    
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
    
    public static Class(constructor: Constructor): void {
        
        if (Serialization.m_constructors.has(constructor.name)) {
            return;
        }
        
        let instance: Object;
        try {
            instance = new constructor();
        }
        catch {
            console.error(`'${constructor.name}' must have a default constructor in order to be serializable`);
            return;
        }
        
        const propertyNames = new Set(Object.getOwnPropertyNames(instance));
        
        const constructors = Serialization.Prototypes(constructor);
        constructors.delete(constructor);
        
        constructors.forEach((parentConstructor: Constructor): void => {
            if (!Serialization.m_constructors.has(parentConstructor.name)) {
                Serialization.Class(parentConstructor);
            }
            
            const parentPropertyNames = Serialization.m_propertyNames.get(parentConstructor);
            if (parentPropertyNames !== undefined) {
                parentPropertyNames.forEach((propertyName: string): boolean => propertyNames.delete(propertyName));
            }
        });
        
        Serialization.m_constructors.set(constructor.name, constructor);
        Serialization.m_propertyNames.set(constructor, propertyNames);
        
    }
    
    public static Property(target: Object, propertyName: string): void {
        
        const constructor = target.constructor as Constructor;
        
        let propertyNames = Serialization.m_propertyNames.get(constructor);
        if (propertyNames === undefined) {
            propertyNames = new Set();
            Serialization.m_constructors.set(constructor.name, constructor);
            Serialization.m_propertyNames.set(constructor, propertyNames);
        }
        
        propertyNames.add(propertyName);
        
    }
    
    public static Serialize(target: any): Optional<Data> {
        
        const constructor = target.constructor as Constructor;
        
        if (!(target instanceof Object)) {
            return new Data(constructor.name, target);
        }
        
        const constructors = Serialization.Prototypes(constructor);
        const value = Array.from(constructors).reverse()
            .reduce(
                (state: { [propertyName: string ]: any }, constructor: Constructor): { [propertyName: string ]: any } => {
                    const propertyNames = Serialization.m_propertyNames.get(constructor);
                    if (propertyNames === undefined) {
                        return state;
                    }
                    
                    propertyNames.forEach(
                        (propertyName: string): void => {
                            const value = target[propertyName];
                            const data = Serialization.Serialize(value);
                            state[propertyName] = data;
                        }
                    );
                    
                    return state;
                },
                {}
            );
        
        const data = new Data(
            constructor.name,
            value
        );
        
        Array.from(constructors).reverse()
            .forEach(
                (constructor: Constructor): void => {
                    if (constructor.prototype.serialize !== undefined) {
                        constructor.prototype.serialize.call(target, data);
                    }
                }
            );
        
        return data;
        
    }
    
}

// export class Context<EntityType extends Entity<EntityType>, DataType> {
    
//     private m_scene: Scene<EntityType, any>;
    
//     public get scene(): Scene<EntityType, any> {
//         return this.m_scene;
//     }
    
//     private m_data: DataType;
    
//     public get data(): DataType {
//         return this.m_data;
//     }
    
//     private m_references: any;
    
//     public constructor(scene: Scene<EntityType, any>, data: any, references: any = {}) {
//         this.m_scene = scene;
//         this.m_data = data;
//         this.m_references = references;
//     }
    
//     public get<IndexDataType>(index: string): Context<EntityType, IndexDataType> {
//         return new Context(this.m_scene, (this.data as { [index: string]: any })[index], this.m_references);
//     }
    
//     public resolve(id: Id): EntityType {
//         let referenceId = this.m_references[id];
//         if (referenceId === undefined) {
//             referenceId = this.m_scene.entities.add().id;
//             this.m_references[id] = referenceId;
//         }
//         return this.m_scene.entities.get(referenceId);
//     }
    
// }
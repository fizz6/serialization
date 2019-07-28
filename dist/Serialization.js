"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Data_1 = require("./Data");
class Serialization {
    static Prototypes(constructor, out) {
        if (out === undefined) {
            out = new Set();
        }
        out.add(constructor);
        const prototypeConstructor = constructor.prototype.__proto__.constructor;
        if (prototypeConstructor === Object) {
            return out;
        }
        return Serialization.Prototypes(prototypeConstructor, out);
    }
    static Class(constructor) {
        if (Serialization.m_constructors.has(constructor.name) || Serialization.m_propertyNames.has(constructor)) {
            return;
        }
        let instance;
        try {
            instance = new constructor();
        }
        catch (_a) {
            console.error(`'${constructor.name}' must have a default constructor in order to be serializable`);
            return;
        }
        const propertyNames = new Set(Object.getOwnPropertyNames(instance));
        const constructors = Serialization.Prototypes(constructor);
        constructors.delete(constructor);
        constructors.forEach((parentConstructor) => {
            if (!Serialization.m_constructors.has(parentConstructor.name) || !Serialization.m_propertyNames.has(parentConstructor)) {
                Serialization.Class(parentConstructor);
            }
            const parentPropertyNames = Serialization.m_propertyNames.get(parentConstructor);
            if (parentPropertyNames !== undefined) {
                parentPropertyNames.forEach((propertyName) => propertyNames.delete(propertyName));
            }
        });
        Serialization.m_constructors.set(constructor.name, constructor);
        Serialization.m_propertyNames.set(constructor, propertyNames);
    }
    static Property(target, propertyName) {
        const constructor = target.constructor;
        let propertyNames = Serialization.m_propertyNames.get(constructor);
        if (propertyNames === undefined) {
            propertyNames = new Set();
            Serialization.m_constructors.set(constructor.name, constructor);
            Serialization.m_propertyNames.set(constructor, propertyNames);
        }
        propertyNames.add(propertyName);
    }
    static Serialize(target) {
        const constructor = target.constructor;
        if (!(target instanceof Object)) {
            return new Data_1.default(constructor.name, target);
        }
        const constructors = Serialization.Prototypes(constructor);
        const value = Array.from(constructors).reverse()
            .reduce((state, constructor) => {
            const propertyNames = Serialization.m_propertyNames.get(constructor);
            if (propertyNames === undefined) {
                return state;
            }
            propertyNames.forEach((propertyName) => {
                const value = target[propertyName];
                const data = Serialization.Serialize(value);
                state[propertyName] = data;
            });
            return state;
        }, {});
        const data = new Data_1.default(constructor.name, value);
        Array.from(constructors).reverse()
            .forEach((constructor) => {
            if (constructor.prototype.serialize !== undefined) {
                constructor.prototype.serialize.call(target, data);
            }
        });
        return data;
    }
}
Serialization.m_constructors = new Map();
Serialization.m_propertyNames = new Map();
Serialization.m_base = new Set(['Boolean', 'Null', 'Undefined', 'Number', 'BigInt', 'String', 'Symbol']);
exports.default = Serialization;
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

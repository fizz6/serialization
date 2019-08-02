import Namespace from '@fizz6/utility/Namespace';
import Context from './Context';
import Data from './Data';
import { Optional } from './Optional';

interface Constructor {
    new (...args: any[]): Object;
}

class Serialization {
    
    private static m_constructors: Map<string, Constructor> = new Map();

    private static m_properties: Map<Constructor, Set<string>> = new Map();
    
    private static m_prototypes: Map<Constructor, Set<Constructor>> = new Map();
    
    private static Prototypes(constructor: Constructor, out: Set<Constructor> = new Set()): Set<Constructor> {
        out.add(constructor);
            
        constructor = constructor.prototype.__proto__.constructor;
        if (constructor === Object) {
            return out;
        }
        
        return Serialization.Prototypes(constructor, out);
    }
    
    public static Register(constructor: Constructor): void {
        const identifier = Namespace.Resolve(constructor);
        if (Serialization.m_constructors.has(identifier)) {
            throw new Error(`Duplicate serialization registration of '${identifier}'`)
        }
        
        const prototypes = Serialization.Prototypes(constructor);
        
        Serialization.m_constructors.set(identifier, constructor);
        Serialization.m_properties.set(constructor, new Set());
        Serialization.m_prototypes.set(constructor, prototypes);
    }
    
    public static Class(constructor: Constructor): void {
        const identifier = Namespace.Resolve(constructor);
        
    }
    
}

if (!Namespace.globals.has(Serialization.name)) {
    Namespace.globals.set(Serialization.name, Serialization);
}

export default Namespace.globals.get(Serialization.name);

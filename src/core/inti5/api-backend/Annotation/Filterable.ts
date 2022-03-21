import { ObjectManager } from '@inti5/object-manager';
import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import { FilterOperator } from '../def';
import { MetadataStorage } from '../MetadataStorage';


function Filterable (
    operators? : FilterOperator[]
) : PropertyDecorator
{
    return (Target : any, property : string | symbol) => {
        const [ ClassConstructor, ClassPrototype ] = getDecoratorTarget(Target);
        
        ObjectManager.getSingleton().getInstance(MetadataStorage)
            .registerFilterable(
                ClassConstructor,
                property.toString(),
                { operators }
            );
    };
}

export { Filterable };

import { ObjectManager } from '@inti5/object-manager';
import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import { SortingOperator } from '../def';
import { MetadataStorage } from '../MetadataStorage';



function Sortable (
    operators : SortingOperator[] = [ 'ASC', 'DESC' ]
) : PropertyDecorator
{
    return (Target : any, property : string | symbol) => {
        const [ ClassConstructor, ClassPrototype ] = getDecoratorTarget(Target);
        
        ObjectManager.getSingleton().getInstance(MetadataStorage)
            .registerSortable(
                ClassPrototype.constructor,
                property.toString(),
                { operators }
            );
    };
}

export { Sortable };

import debounce from 'lodash/debounce';
import { getDecoratorTarget } from './getDecoratorTarget';


export function Debounce (delay : number = 300) : MethodDecorator
{
    return (Target : any, method : string | symbol, descriptor : PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = debounce(originalMethod, delay);
    };
}

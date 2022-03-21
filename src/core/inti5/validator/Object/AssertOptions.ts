import { AssertObjectOptions } from '../def';
import { Validator } from '../Validator';


export function AssertOptions (
    options : AssertObjectOptions = {}
) : ClassDecorator
{
    return (TargetConstructor : Function) => {
        Validator.getSingleton()
            .registerObjectOptions(TargetConstructor, options);
    };
}

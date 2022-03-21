export function getDecoratorTarget<T>(Target : any): [ Function, Object ]
{
    if (Target?.prototype?.constructor === Target) {
        return [ Target, Target.prototype ];
    }
    else {
        return [ Target.constructor, Target ];
    }
}

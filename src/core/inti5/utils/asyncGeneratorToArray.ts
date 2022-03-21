export async function asyncGeneratorToArray<T, P> (
    iterator : AsyncGenerator<P>,
    expander : (chunk : P) => T[] = (chunk) => [ <any> chunk ],
) : Promise<T[]>
{
    const array : T[] = [];
    for await (const chunk of iterator) {
        const expand = expander(chunk);
        array.push(...expand);
    }
    return array;
}

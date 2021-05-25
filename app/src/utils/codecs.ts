import * as t from "io-ts";


export function createEnumType<T extends string>(allValues: readonly T[]) {
    return new t.Type<T, string, unknown>(
        'frequencyType',
        (u: unknown): u is T => allValues.indexOf(u as T) >= 0,
        (input, context) => {
            const index = allValues.indexOf(input as T);
            if (index >= 0) {
                return t.success(allValues[index]);
            } else {
                return t.failure(input, context);
            }
        },
        (v) => v,
    );
}
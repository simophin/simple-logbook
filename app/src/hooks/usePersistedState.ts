import * as t from "io-ts";
import {useEffect, useState} from "react";
import {isRight} from "fp-ts/Either";
import {useDebounce} from "./useDebounce";


export function usePersistedState<T extends t.Any>(key: string | undefined, type: T, defaultValue?: t.TypeOf<T> | (t.TypeOf<T> | undefined) | (() => t.TypeOf<T>)):
    [typeof defaultValue extends undefined ? (t.TypeOf<T> | undefined) : t.TypeOf<T>, (v: typeof defaultValue) => void] {
    const [value, setValue] = useState(() => {
        if (key) {
            const stored = localStorage.getItem(key);
            if (stored) {
                const decoded = type.decode(JSON.parse(stored));
                if (isRight(decoded)) {
                    return decoded.right;
                }
            }
        }

        if (typeof defaultValue === 'function') {
            return (defaultValue as () => t.TypeOf<T>)();
        }

        return defaultValue;
    });

    const debouncedValue = useDebounce(value, 500);

    useEffect(() => {
        if (key) {
            if (debouncedValue) {
                localStorage.setItem(key, JSON.stringify(type.encode(debouncedValue)));
            } else {
                localStorage.removeItem(key);
            }
        }
    }, [key, type, debouncedValue]);

    return [value, setValue];
}
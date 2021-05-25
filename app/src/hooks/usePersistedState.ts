import * as t from "io-ts";
import {useEffect, useState} from "react";
import {isRight} from "fp-ts/Either";


export function usePersistedState<T extends t.Any>(key: string, type: T, defaultValue?: t.TypeOf<T> | (t.TypeOf<T> | undefined)):
    [typeof defaultValue extends undefined ? (t.TypeOf<T> | undefined) : t.TypeOf<T>, (v: typeof defaultValue) => void] {
    const [value, setValue] = useState(() => {
        const stored = localStorage.getItem(key);
        if (stored) {
            const decoded = type.decode(JSON.parse(stored));
            if (isRight(decoded)) {
                return decoded.right;
            }
        }
        return defaultValue;
    });

    useEffect(() => {
        if (value) {
            localStorage.setItem(key, JSON.stringify(type.encode(value)));
        } else {
            localStorage.removeItem(key);
        }
    }, [key, type, value]);

    return [value, setValue];
}
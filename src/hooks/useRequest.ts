import {useEffect, useState} from "react";
import * as t from 'io-ts';
import {isLeft} from "fp-ts/Either";

export interface RequestState<T> {
    type: string;
    data?: T;
}

export interface Loading<T> extends RequestState<T> {
    type: 'loading'
}

export interface Loaded<T> extends RequestState<T> {
    type: 'loaded';
    data: T;
}

export interface Error<T> extends RequestState<T> {
    type: 'error';
    error?: {
        code: number | string;
        desc?: any;
    }
}

export function useRequest<T>(url: string,
                              method: 'get' | 'post' | 'delete' | 'put',
                              ioType: t.Type<T>,
                              body?: object): RequestState<T> {
    const [result, setResult] = useState<RequestState<T>>({type: 'loading'} as Loading<T>);
    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            try {
                const res = await fetch(url, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    signal: controller.signal,
                    redirect: 'follow',
                    body: body ? JSON.stringify(body) : undefined,
                });

                if (res.ok) {
                    const data = ioType.decode(res.body);
                    if (isLeft(data)) {
                        setResult({
                            type: 'error', error: {
                                code: 'invalid_data',
                                desc: data.left.pop()?.message,
                            }
                        } as Error<T>);
                    } else {
                        setResult({type: 'loaded', data: data.right} as Loaded<T>);
                    }

                } else {
                    setResult({
                        type: 'error', error: {
                            code: res.status,
                            desc: await res.text()
                        }
                    } as Error<T>);
                }
            } catch (e) {
                setResult({
                    type: 'error', error: {
                        code: 'unknown',
                        desc: e
                    }
                } as Error<T>);
            }
        })();

        return () => {
            if (!controller.signal.aborted) {
                console.log('Aborting request', url);
                controller.abort();
            }
        }

    }, [url, method, body, setResult]);

    return result;
}
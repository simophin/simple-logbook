import {useEffect, useState} from "react";
import {Observable} from "rxjs";


interface LoadingState<T> {
    type: 'loading';
    previous?: T;
}

interface LoadedState<T> {
    type: 'loaded';
    data: T;
}

interface ErrorState {
    type: 'error';
    error: Error;
}

export type State<T> = LoadingState<T> | LoadedState<T> | ErrorState;

export function getLoadedValue<T>(s: State<T>) {
    switch (s.type) {
        case 'loaded': return s.data;
        case 'loading': return s.previous;
    }
    return undefined;
}

export function useObservable<T>(factory: () => Observable<T>, deps: any[]): State<T> {
    const [result, setResult] = useState<State<T>>({type: 'loading'});
    useEffect(() => {
        setResult({
            type: 'loading',
            previous: getLoadedValue(result)
        });
        const subscription = factory().subscribe({
            next: (data) => setResult({
                type: 'loaded',
                data,
            }),
            error: (error) => {
                setResult({
                    type: 'error',
                    error
                })
            }
        });

        return () => {
            subscription.unsubscribe();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setResult, ...deps]);

    return result;
}
import {useEffect, useState} from "react";
import {Observable} from "rxjs";


interface LoadingState {
    type: 'loading';
}

interface LoadedState<T> {
    type: 'loaded';
    data: T;
}

interface ErrorState {
    type: 'error';
    error: Error;
}

export type State<T> = LoadingState | LoadedState<T> | ErrorState;

export function useObservable<T>(factory: () => Observable<T>, deps: any[]): State<T> {
    const [result, setResult] = useState<State<T>>({type: 'loading'});
    useEffect(() => {
        const subscription = factory().subscribe({
            next: (data) => setResult({
                type: 'loaded',
                data,
            }),
            error: (error) => setResult({
                type: 'error',
                error
            })
        });

        return () => {
            subscription.unsubscribe();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setResult, ...deps]);

    return result;
}
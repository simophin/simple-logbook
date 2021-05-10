import {useCallback, useContext} from "react";
import {AppState} from "../state/AppState";


export default function useAuthErrorReporter(): (e: Error) => unknown {
    const {setUserState} = useContext(AppState);
    return useCallback((e: Error) => {
        if (e?.name === 'http_error' && (e as any).code === 401) {
            setUserState({state: 'auth_error'});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setUserState]);
}
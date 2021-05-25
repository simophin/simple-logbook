import {useCallback, useContext} from "react";
import {AppStateContext} from "../state/AppStateContext";


export default function useAuthErrorReporter(): (e: Error) => unknown {
    const {setUserState} = useContext(AppStateContext);
    return useCallback((e: any) => {
        if (e.response && e.response.status === 401) {
            setUserState({state: 'auth_error'});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setUserState]);
}
import {useContext, useMemo} from "react";
import {ExtraRequestProps} from "../api/common";
import {AppStateContext} from "../state/AppStateContext";


export function buildAuthProps(token?: string): ExtraRequestProps {
    return token ? {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    } : {};
}

export function useAuthToken() {
    const {userState} = useContext(AppStateContext);
    return userState?.state === 'with_token' ? userState.token : undefined;
}

export default function useAuthProps(): ExtraRequestProps {
    const token = useAuthToken();
    return useMemo(() => buildAuthProps(token), [token]);
}
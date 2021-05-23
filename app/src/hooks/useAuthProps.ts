import {useContext, useMemo} from "react";
import {ExtraRequestProps} from "../api/common";
import {AppState} from "../state/AppState";


export function buildAuthProps(token?: string): ExtraRequestProps {
    return token ? {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    } : {};
}

export function useAuthToken() {
    const {userState} = useContext(AppState);
    return userState?.state === 'with_token' ? userState.token : undefined;
}

export default function useAuthProps(): ExtraRequestProps {
    const token = useAuthToken();
    return useMemo(() => buildAuthProps(token), [token]);
}
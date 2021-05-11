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

export default function useAuthProps(): ExtraRequestProps {
    const {userState} = useContext(AppState);
    const token = userState?.state === 'with_token' ? userState.token : undefined;
    return useMemo(() => buildAuthProps(token), [token]);
}
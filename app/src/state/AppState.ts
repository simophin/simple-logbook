import {createContext} from "react";

export type UserState = {
    state: 'with_token',
    token: string,
} | {
    state: 'auth_error',
} | undefined;

type AppStateType = {
    userState: UserState,
    transactionUpdatedTime?: number,

    setUserState: (n: UserState) => unknown,
    reportTransactionUpdated: () => unknown,
};

export const AppState = createContext<AppStateType>({
    userState: undefined,
    setUserState: () => {},
    reportTransactionUpdated: () => {},
});
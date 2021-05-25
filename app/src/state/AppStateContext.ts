import {createContext} from "react";

export type UserState = {
    state: 'with_token',
    token: string,
} | {
    state: 'auth_error',
} | undefined;

export type AppState = {
    userState: UserState,
    transactionUpdatedTime?: number,

    setUserState: (n: UserState) => unknown,
    reportTransactionUpdated: () => unknown,
};

export const AppStateContext = createContext<AppState>({
    userState: undefined,
    setUserState: () => {},
    reportTransactionUpdated: () => {},
});
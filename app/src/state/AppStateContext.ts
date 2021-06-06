import {createContext} from "react";
import * as t from 'io-ts';

export const userStateType = t.union([
    t.type({
        state: t.literal('with_token'),
        token: t.string,
    }),
    t.type({
        state: t.literal('auth_error'),
    }),
    t.undefined
]);


export type UserState = t.TypeOf<typeof userStateType>;

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
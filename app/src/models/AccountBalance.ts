import * as t from 'io-ts';

export const AccountBalanceType = t.type({
    account: t.string,
    balance: t.number,
});

export type AccountBalance = t.TypeOf<typeof AccountBalanceType>;
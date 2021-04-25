import * as t from 'io-ts';

export const AccountType = t.type({
    name: t.string,
    balance: t.number,
    lastTransDate: t.string,
});

export const AccountArrayType = t.array(AccountType);
export type Account = t.TypeOf<typeof AccountType>;
import * as t from 'io-ts';

export const AccountSummaryType = t.type({
    name: t.string,
    balance: t.number,
});

export const AccountSummaryArrayType = t.array(AccountSummaryType);
export type AccountSummary = t.TypeOf<typeof AccountSummaryType>;
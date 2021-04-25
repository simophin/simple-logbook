import * as t from 'io-ts';

export const AccountGroupType = t.type({
    groupName: t.string,
    accounts: t.array(t.string),
});

export const AccountGroupArrayType = t.array(AccountGroupType);

export type AccountGroup = t.TypeOf<typeof AccountGroupType>;
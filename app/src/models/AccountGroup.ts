import * as t from 'io-ts';

export const accountGroupType = t.type({
    groupName: t.string,
    accounts: t.array(t.string),
});

export const accountGroupArrayType = t.array(accountGroupType);

export type AccountGroup = t.TypeOf<typeof accountGroupType>;
import * as t from 'io-ts';

export const TransactionType = t.type({
    id: t.string,
    description: t.string,
    fromAccount: t.string,
    toAccount: t.string,
    amount: t.number,
    transDate: t.string,
    updatedDate: t.string,
});

export const TransactionArrayType = t.array(TransactionType);

export type Transaction = t.TypeOf<typeof TransactionType>;
import * as t from 'io-ts';
import {CurrencyType} from "./currency";

export const TransactionType = t.type({
    id: t.string,
    desc: t.string,
    fromAccount: t.string,
    toAccount: t.string,
    amount: CurrencyType,
});

export type Transaction = t.TypeOf<typeof TransactionType>;
import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {currency} from "../api/currencyCodec";
import {localDate, zonedDateTime} from "../api/DateCodecs";

export const TransactionType = t.type({
    id: codec.NonEmptyString,
    description: codec.NonEmptyString,
    fromAccount: codec.NonEmptyString,
    toAccount: codec.NonEmptyString,
    amount: currency,
    transDate: localDate,
    updatedDate: zonedDateTime,
});

export const TransactionArrayType = t.array(TransactionType);

export type Transaction = t.TypeOf<typeof TransactionType>;
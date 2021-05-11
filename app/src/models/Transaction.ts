import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {currencyType, localDateType, zonedDateTimeType} from "../api/codecs";

export const TransactionType = t.type({
    id: codec.NonEmptyString,
    description: codec.NonEmptyString,
    fromAccount: codec.NonEmptyString,
    toAccount: codec.NonEmptyString,
    amount: currencyType,
    transDate: localDateType,
    updatedDate: zonedDateTimeType,
});

export const TransactionArrayType = t.array(TransactionType);

export type Transaction = t.TypeOf<typeof TransactionType>;
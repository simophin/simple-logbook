import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {currencyType, localDateType, zonedDateTimeType} from "../api/codecs";

export const transactionType = t.type({
    id: codec.NonEmptyString,
    description: codec.NonEmptyString,
    fromAccount: codec.NonEmptyString,
    toAccount: codec.NonEmptyString,
    amount: currencyType,
    transDate: localDateType,
    updatedDate: zonedDateTimeType,
    attachments: t.array(codec.NonEmptyString),
});

export const transactionArrayType = t.array(transactionType);

export type Transaction = t.TypeOf<typeof transactionType>;
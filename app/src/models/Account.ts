import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {currencyType} from "../api/codecs";

export const AccountType = t.type({
    name: codec.NonEmptyString,
    balance: currencyType,
    lastTransDate: codec.DateFromISOString,
});

export const AccountArrayType = t.array(AccountType);
export type Account = t.TypeOf<typeof AccountType>;
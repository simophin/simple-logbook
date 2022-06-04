import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import { currencyType, zonedDateTimeType } from '../api/codecs';

export const tagType = t.type({
    tag: codec.NonEmptyString,
    numTx: t.number,
    total: currencyType,
    lastUpdated: zonedDateTimeType
});

export const tagArrayType = t.array(tagType);

export type Tag = t.TypeOf<typeof tagType>;
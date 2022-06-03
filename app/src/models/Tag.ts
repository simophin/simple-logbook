import * as t from 'io-ts';
import * as codec from 'io-ts-types';

export const tagType = t.type({
    tag: codec.NonEmptyString,
    numTx: t.number
});

export const tagArrayType = t.array(tagType);

export type Tag = t.TypeOf<typeof tagType>;
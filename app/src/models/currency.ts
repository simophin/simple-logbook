import * as t from 'io-ts';

export const CurrencyType = new t.Type<string>('string',
    (input): input is string => typeof input === 'string', (input, context) =>
        (typeof input === 'string' && !isNaN(parseFloat(input))) ? t.success(input) : t.failure(input, context),
    t.identity
);

export type Currency = t.TypeOf<typeof CurrencyType>;
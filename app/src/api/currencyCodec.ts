import * as t from 'io-ts';
import cjs from 'currency.js';

type CurrencyType = ReturnType<cjs.Constructor>;

export const currency = new t.Type<CurrencyType, number, unknown>(
    'currencyjs',
    (u: unknown): u is CurrencyType => typeof u === 'number',
    (input, context) => typeof input === 'number'
        ? t.success(cjs(input).divide(100))
        : t.failure(input, context),
    (a) => Math.trunc(a.multiply(100).value),
);
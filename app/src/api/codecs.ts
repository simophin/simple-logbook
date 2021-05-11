import * as t from 'io-ts';
import cjs from 'currency.js';
import {LocalDate, ZonedDateTime, ZoneOffset} from "@js-joda/core";

type CurrencyJS = ReturnType<cjs.Constructor>;

export const currencyType = new t.Type<CurrencyJS, number, unknown>(
    'currencyjs',
    (u: unknown): u is CurrencyJS => typeof u === 'number',
    (input, context) => typeof input === 'number'
        ? t.success(cjs(input).divide(100))
        : t.failure(input, context),
    (a) => Math.trunc(a.multiply(100).value),
);

export const localDateType = new t.Type<LocalDate, string, unknown>(
    'joda-local-date',
    (u: unknown): u is LocalDate => u instanceof LocalDate,
    (input, context) => {
        if (typeof input === 'string') {
            return t.success(LocalDate.parse(input));
        } else if (input instanceof LocalDate) {
            return t.success(input);
        } else {
            return t.failure(input, context);
        }
    },
    (v) => v.toJSON(),
);

export const zonedDateTimeType = new t.Type<ZonedDateTime, string, unknown>(
    'joda-zoned-datetime',
    (u: unknown): u is ZonedDateTime => u instanceof ZonedDateTime,
    (input, context) => {
        if (typeof input === 'string') {
            return t.success(ZonedDateTime.parse(input));
        } else if (input instanceof ZonedDateTime) {
            return t.success(input);
        } else {
            return t.failure(input, context);
        }
    },
    (v) => v.withZoneSameInstant(ZoneOffset.UTC).toJSON(),
);
import * as t from 'io-ts';
import {LocalDate, ZonedDateTime, ZoneOffset} from "@js-joda/core";

export const localDate = new t.Type<LocalDate, string, unknown>(
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

export const zonedDateTime = new t.Type<ZonedDateTime, string, unknown>(
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
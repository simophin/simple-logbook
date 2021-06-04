import {LocalDate, ZonedDateTime, ZoneId} from "@js-joda/core";


export function formatAsStandardLocalDate(z: ZonedDateTime | LocalDate) {
    if (z instanceof ZonedDateTime) {
        return z.withZoneSameInstant(ZoneId.systemDefault())
            .toLocalDate()
            .toJSON();
    } else {
        return z.toJSON();
    }
}

export function formatAsLocaleLocalDate(z: ZonedDateTime | LocalDate) {
    let d: ZonedDateTime;
    if (z instanceof LocalDate) {
        d = z.atStartOfDay().atZone(ZoneId.systemDefault());
    } else {
        d = z;
    }

    return new Date(d.toInstant().toEpochMilli()).toLocaleDateString();
}
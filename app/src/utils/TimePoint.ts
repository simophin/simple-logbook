import {convert, DayOfWeek, LocalDate} from "@js-joda/core";
import {Frequency} from "../models/frequency";

const freqPatterns: Record<Frequency, RegExp> = {
    "Daily": /^(\d{4})-(\d{1,3})$/,
    "Weekly": /^(\d{4})-(\d{1,2})$/,
    "Monthly": /^(\d{4})-(\d{1,2})$/,
    "Yearly": /^(\d{4})$/,
};
export type TimePoint = { year: number } |
    { year: number, month: number } |
    { year: number, dayOfYear: number } |
    { year: number, weekOfYear: number };

function timePointToLocalDate(tp: TimePoint) {
    let date: LocalDate;
    if ('weekOfYear' in tp) {
        const startOfYear = LocalDate.ofYearDay(tp.year, 1);
        const endOfYear = LocalDate.of(tp.year, 12, 31);
        date = startOfYear.plusWeeks(tp.weekOfYear - 1);
        date = date.plusDays(DayOfWeek.SUNDAY.ordinal() - date.dayOfWeek().ordinal());
        if (date.dayOfWeek() !== DayOfWeek.SUNDAY) {
            throw new Error('date must be sunday');
        }

        if (date.isAfter(endOfYear)) {
            date = endOfYear;
        }
    } else if ('dayOfYear' in tp) {
        date = LocalDate.ofYearDay(tp.year, tp.dayOfYear);
    } else if ('month' in tp) {
        date = LocalDate.of(tp.year, tp.month, 1);
        date = date.withDayOfMonth(date.lengthOfMonth());
    } else {
        date = LocalDate.of(tp.year, 12, 31);
    }
    return date;
}

export function timePointToValue(tp: TimePoint) {
    return timePointToLocalDate(tp).toEpochDay();
}

function timePointFromLocalDate(d: LocalDate, freq: Frequency) {
    switch (freq) {
        case "Monthly":
            return {year: d.year(), month: d.month().value()};
        case "Weekly":
        case "Daily":
            return {year: d.year(), month: d.month().value(), dayOfMonth: d.dayOfMonth()};
        case "Yearly":
            return {year: d.year()}
    }
}

export function timePointFromValue(v: number, freq: Frequency) {
    return timePointFromLocalDate(LocalDate.ofEpochDay(v), freq);
}

export function timePointFromString(v: string, freq: Frequency): TimePoint | undefined {
    const matches = freqPatterns[freq].exec(v);
    if (!matches) {
        return undefined;
    }
    switch (freq) {
        case "Monthly":
            return {year: parseInt(matches[1]), month: parseInt(matches[2])};
        case "Weekly":
            return {year: parseInt(matches[1]), weekOfYear: parseInt(matches[2])};
        case "Daily":
            return {year: parseInt(matches[1]), dayOfYear: parseInt(matches[2])};
        case "Yearly":
            return {year: parseInt(matches[1])}
    }
}

export function formatTimePoint(tp: TimePoint) {
    if ('dayOfYear' in tp || 'weekOfYear' in tp) {
        return convert(timePointToLocalDate(tp)).toDate().toLocaleDateString();
    }

    if ('month' in tp) {
        return `${tp.year}-${tp.month}`;
    }

    return tp.year.toString();
}

export function compareTimePoint(lhs: TimePoint, rhs: TimePoint) {
    if (lhs.year !== rhs.year) {
        return lhs.year - rhs.year;
    }

    if ("weekOfYear" in lhs && "weekOfYear" in rhs) {
        return lhs.weekOfYear - rhs.weekOfYear;
    }

    if ("month" in lhs && "month" in rhs) {
        return lhs.month - rhs.month;
    }

    if ("dayOfYear" in lhs && "dayOfYear" in rhs) {
        return lhs.dayOfYear - rhs.dayOfYear;
    }

    return 0;
}
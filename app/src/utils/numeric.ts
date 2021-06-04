import currency from 'currency.js';

export const numericRegExp = /^\d+\.?\d{0,2}$/;
export const signedNumericRegExp = /^[+-]?\d*\.?\d{0,2}$/;

export function isValidNumber(v: string) {
    return !isNaN(parseFloat(v));
}

export function toCurrencyOrZero(v: string): currency {
    const value = currency(v);
    if (isNaN(value.value)) {
        return currency(0);
    }
    return value;
}

export function formatAsCurrency(v: string | number | currency, opts?: {precision: number}): string {
    let value: currency;
    if (typeof v === 'string' || typeof v === 'number') {
        value = currency(v);
    } else {
        value = v;
    }
    return value.format(opts);
}
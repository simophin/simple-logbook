import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {currency} from "./currencyCodec";
import {request} from "./common";
import config from "../config";

const DataPoint = t.type({
    total: currency,
    timePoint: codec.NonEmptyString,
});

const Response = t.array(DataPoint);

export type Frequency = 'Monthly' | 'Weekly' | 'Daily' | 'Yearly';

export type Filter = {
    from?: string,
    to?: string,
    freq: Frequency,
    accounts: string[],
};

export type ResponseType = t.TypeOf<typeof Response>;

export function getSumReport({accounts, freq, from, to}: Filter) {
    return request({
        url: `${config.baseUrl}/reports/sum`,
        method: 'post',
        ioType: Response,
        body: {
            from,
            to,
            freq,
            accounts,
        }
    })
}
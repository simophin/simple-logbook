import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {currencyType} from "./codecs";
import {ExtraRequestProps, request} from "./common";
import config from "../config";
import {Frequency} from "../models/frequency";

const DataPoint = t.type({
    total: currencyType,
    timePoint: codec.NonEmptyString,
});

const Response = t.array(DataPoint);

export type Filter = {
    from?: string,
    to?: string,
    freq: Frequency,
    accounts: string[],
};

export type ResponseType = t.TypeOf<typeof Response>;

export function getSumReport({accounts, freq, from, to, ...extraProps}: Filter & ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/reports/sum`,
        method: 'post',
        ioType: Response,
        body: {
            from,
            to,
            freq,
            accounts,
        },
        ...extraProps
    })
}
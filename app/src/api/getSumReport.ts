import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {currencyType} from "./codecs";
import {ExtraRequestProps, request} from "./common";
import config from "../config";
import {frequencyType} from "../models/frequency";

const dataPointType = t.type({
    total: currencyType,
    timePoint: codec.NonEmptyString,
});

const responseType = t.array(dataPointType);

const optionalFilterType = t.partial({
    from: t.string,
    to: t.string,
    accounts: t.array(t.string),
});

const mandatoryFilterType = t.type({
    freq: frequencyType,
})

const filterType = t.intersection([optionalFilterType, mandatoryFilterType]);

export type Filter = t.TypeOf<typeof filterType>;
export type Response = t.TypeOf<typeof responseType>;

export function getSumReport({accounts, freq, from, to, ...extraProps}: Filter & ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/reports/sum`,
        method: 'post',
        inputType: filterType,
        body: {
            from,
            to,
            freq,
            accounts,
        },
        outputType: responseType,
        ...extraProps
    })
}

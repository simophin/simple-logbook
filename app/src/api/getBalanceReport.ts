import * as t from 'io-ts';
import {currencyType, localDateType} from "./codecs";
import {ExtraRequestProps, request} from "./common";
import config from "../config";

const DataPoint = t.type({
    balance: currencyType,
    date: localDateType,
});

const responseType = t.array(DataPoint);

const filterType = t.partial({
    from: t.string,
    to: t.string,
    accounts: t.array(t.string),
});


export type Filter = t.TypeOf<typeof filterType>;
export type Response = t.TypeOf<typeof responseType>;

export function getBalanceReport(req: Filter, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/reports/balance`,
        method: 'post',
        inputType: filterType,
        body: req,
        outputType: responseType,
        ...extraProps
    })
}
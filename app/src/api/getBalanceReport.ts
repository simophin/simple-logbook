import * as t from 'io-ts';
import {currencyType, localDateType} from "./codecs";
import {ExtraRequestProps, request} from "./common";
import config from "../config";

const DataPoint = t.type({
    balance: currencyType,
    date: localDateType,
});

const Response = t.array(DataPoint);

export type Filter = {
    from?: string,
    to?: string,
    accounts: string[],
};

export type ResponseType = t.TypeOf<typeof Response>;

export function getBalanceReport({accounts, from, to}: Filter, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/reports/balance`,
        method: 'post',
        ioType: Response,
        body: {
            from,
            to,
            accounts,
        },
        ...extraProps
    })
}
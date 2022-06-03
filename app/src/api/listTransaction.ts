import * as t from 'io-ts';
import { transactionArrayType } from "../models/Transaction";
import { ExtraRequestProps, request } from "./common";
import config from "../config";
import { commonListFilterType } from './commonList';

const filterType = t.union(
    [
        t.partial({
            accounts: t.array(t.string),
            tags: t.array(t.string)
        }),
        commonListFilterType
    ]);

export type Filter = t.TypeOf<typeof filterType>;

const responseType = t.type({
    total: t.number,
    data: transactionArrayType,
});

export function listTransaction(filter: Filter = {}, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/transactions/list`,
        method: 'post',
        inputType: filterType,
        body: filter,
        outputType: responseType,
        ...extraProps,
    })
}

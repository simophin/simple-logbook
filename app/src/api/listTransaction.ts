import * as t from 'io-ts';
import {TransactionArrayType} from "../models/Transaction";
import {ExtraRequestProps, request} from "./common";
import config from "../config";


export type Filter = {
    from?: Date,
    to?: Date,
    q?: string,
    limit?: number,
    offset?: number,
    accounts?: string[],
}

const ListResultType = t.type({
    limit: t.number,
    total: t.number,
    offset: t.number,
    data: TransactionArrayType,
});

export function listTransaction(filter: Filter = {}, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/transactions/list`,
        method: 'post',
        ioType: ListResultType,
        body: filter,
        ...extraProps,
    })
}
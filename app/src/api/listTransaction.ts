import * as t from 'io-ts';
import {TransactionArrayType} from "../models/Transaction";
import {request} from "./common";
import config from "../config";


type Filter = {
    from?: Date,
    to?: Date,
    q?: string,
    limit?: number,
    size?: number,
    accounts?: string[],
}

const ListResultType = t.type({
    limit: t.number,
    total: t.number,
    offset: t.number,
    data: TransactionArrayType,
});

export function listTransaction(filter: Filter) {
    return request({
        url: `${config.baseUrl}/transactions/list`,
        method: 'post',
        ioType: ListResultType,
        body: filter,
    })
}
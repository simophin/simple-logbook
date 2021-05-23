import {Transaction, TransactionType} from "../models/Transaction";
import {ExtraRequestProps, request} from "./common";
import config from "../config";
import * as t from 'io-ts';

export function createTransaction(tx: Transaction, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/transactions`,
        method: 'post',
        ioType: t.array(TransactionType),
        jsonBody: [
            TransactionType.encode(tx)
        ],
        ...extraProps,
    });
}
import {Transaction, TransactionType} from "../models/Transaction";
import {ExtraRequestProps, request} from "./common";
import config from "../config";
import * as t from 'io-ts';

export function createTransaction({tx, ...extraProps}: { tx: Transaction } & ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/transactions`,
        method: 'post',
        ioType: t.array(TransactionType),
        body: [
            TransactionType.encode(tx)
        ],
        ...extraProps,
    });
}
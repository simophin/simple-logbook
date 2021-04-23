import {Transaction, TransactionType} from "../models/Transaction";
import {request} from "./common";
import config from "../config";
import * as t from 'io-ts';


export function createTransaction(tx: Transaction) {
    return request({
        url: `${config.baseUrl}/transactions`,
        method: 'post',
        ioType: t.array(TransactionType),
        body: [
            tx
        ]
    });
}
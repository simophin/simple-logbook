import {Transaction, TransactionArrayType} from "../models/Transaction";
import {request} from "./common";
import config from "../config";

export function createTransaction(tx: Omit<Transaction, 'createdDate'>) {
    return request({
        url: `${config.baseUrl}/transactions`,
        method: 'post',
        ioType: TransactionArrayType,
        body: [
            {
                ...tx,
                createdDate: new Date().toISOString(),
            } as Transaction
        ]
    });
}
import {Transaction, transactionArrayType} from "../models/Transaction";
import {ExtraRequestProps, request} from "./common";
import config from "../config";

export function createTransaction(tx: Transaction, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/transactions`,
        method: 'post',
        inputType: transactionArrayType,
        body: [tx],
        outputType: transactionArrayType,
        ...extraProps,
    });
}
import {request} from "./common";
import config from "../config";
import {TransactionArrayType} from "../models/Transaction";
import {of} from "rxjs";


export function findTransactionsByDesc(desc: string) {
    return desc && desc.trim().length > 0 ? request({
        url: `${config.baseUrl}/transactions/search?desc=${desc}`,
        method: 'get',
        ioType: TransactionArrayType
    }) : of([]);
}
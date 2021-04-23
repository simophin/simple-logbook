import config from "../config";
import {request} from "./common";
import {AccountBalanceType} from "../models/AccountBalance";

export function getAccountBalance(accountName: string, beforeDate?: Date) {
    let url = `${config.baseUrl}/account/balance?account=${accountName}`;
    if (beforeDate) {
        url += `&before_date=${beforeDate.toISOString()}`;
    }
    return request({
        url,
        method: 'get',
        ioType: AccountBalanceType
    });
}
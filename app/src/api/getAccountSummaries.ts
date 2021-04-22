import config from "../config";
import {request} from "./common";
import {AccountSummaryArrayType} from "../models/AccountSummary";

export function getAccountSummaries(beforeDate?: Date) {
    let url = `${config.baseUrl}/accountSummaries`;
    if (beforeDate) {
        url += `?before_date=${beforeDate.toISOString()}`;
    }
    return request({
        url,
        method: 'get',
        ioType: AccountSummaryArrayType
    })
}
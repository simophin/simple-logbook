import {RequestState, useRequest} from "./useRequest";
import config from "../config";
import {Transaction, TransactionType} from "../models/transaction";

export function useTransaction(needle: string): RequestState<Transaction> {
    return useRequest(`${config.baseUrl}/transaction?q=${needle}`, 'get', TransactionType);
}
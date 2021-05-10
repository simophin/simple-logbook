import {ExtraRequestProps, request} from "./common";
import config from "../config";
import {AccountArrayType} from "../models/Account";


export type Filter = {
    q?: string;
    includes?: string[];
}

export default function listAccounts({filter = {}, ...extraProps}: { filter?: Filter } & ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/accounts/list`,
        method: 'post',
        ioType: AccountArrayType,
        body: filter,
        ...extraProps,
    })
}
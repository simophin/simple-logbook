import {request} from "./common";
import config from "../config";
import {AccountArrayType} from "../models/Account";
import {of} from "rxjs";

export function findAccountsByName(name: string) {
    return name && name.trim().length > 0 ? request({
        url: `${config.baseUrl}/accounts/search?name=${name}`,
        method: 'get',
        ioType: AccountArrayType
    }) : of([]);
}
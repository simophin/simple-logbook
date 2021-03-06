import {ExtraRequestProps, request} from "./common";
import config from "../config";
import {AccountArrayType} from "../models/Account";
import * as t from "io-ts";
import { sortType } from "./commonList";

const filterType = t.partial({
    q: t.string,
    includes: t.array(t.string),
    sorts: t.array(sortType),
})

export type Filter = t.TypeOf<typeof filterType>;

export default function listAccounts(filter: Filter = {}, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/accounts/list`,
        method: 'post',
        inputType: filterType,
        body: filter,
        outputType: AccountArrayType,
        ...extraProps,
    })
}

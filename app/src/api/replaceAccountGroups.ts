import {AccountGroup, accountGroupArrayType} from "../models/AccountGroup";
import * as t from "io-ts";
import {ExtraRequestProps, request} from "./common";
import config from "../config";


export default function replaceAccountGroups(data: AccountGroup[], extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/accountGroups`,
        method: 'post',
        inputType: accountGroupArrayType,
        body: data,
        outputType: t.unknown,
        ...extraProps,
    });
}
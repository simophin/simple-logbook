import {AccountGroup} from "../models/AccountGroup";
import * as t from "io-ts";
import {ExtraRequestProps, request} from "./common";
import config from "../config";
import {map} from "rxjs/operators";

const responseType = t.type({
    success: t.number,
});

export default function replaceAccountGroups(data: AccountGroup[], extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/accountGroups`,
        method: 'post',
        jsonBody: data,
        ioType: responseType,
        ...extraProps,
    }).pipe(map(({success}) => success));
}
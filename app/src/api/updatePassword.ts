import {ExtraRequestProps, request} from "./common";
import config from "../config";
import * as t from "io-ts";


export default function updatePassword({
                                           oldPassword,
                                           newPassword,
                                           ...extraProps
                                       }: { oldPassword?: string, newPassword?: string } & ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/changePassword`,
        method: 'post',
        body: {oldPassword, newPassword},
        ioType: t.unknown,
        ...extraProps,
    })
}
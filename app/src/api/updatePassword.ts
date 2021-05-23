import {ExtraRequestProps, request} from "./common";
import config from "../config";
import * as t from "io-ts";

const ResponseType = t.type({
    token: t.string,
});

export default function updatePassword({
                                           oldPassword,
                                           newPassword,
                                           ...extraProps
                                       }: { oldPassword: string, newPassword: string } & ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/changePassword`,
        method: 'post',
        jsonBody: {oldPassword, newPassword},
        ioType: ResponseType,
        ...extraProps,
    })
}
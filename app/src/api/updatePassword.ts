import {ExtraRequestProps, request} from "./common";
import config from "../config";
import * as t from "io-ts";

const requestType = t.type({
    oldPassword: t.string,
    newPassword: t.string,
});

type Request = t.TypeOf<typeof requestType>;

const responseType = t.type({
    token: t.string,
});

export default function updatePassword(req: Request, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/changePassword`,
        method: 'post',
        inputType: requestType,
        body: req,
        outputType: responseType,
        ...extraProps,
    })
}
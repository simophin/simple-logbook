import * as t from 'io-ts';
import {ExtraRequestProps, request} from "./common";
import config from "../config";

const requestType = t.type({
    password: t.string,
})

type Request = t.TypeOf<typeof requestType>;

const responseType = t.type({
    token: t.string,
});

export function signIn(req: Request, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/sign`,
        outputType: responseType,
        inputType: requestType,
        body: req,
        method: 'post',
        ...extraProps,
    });
}

export function refreshToken(props?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/refreshToken`,
        outputType: responseType,
        method: 'post',
        inputType: t.type({}),
        body: {},
        ...props,
    });
}

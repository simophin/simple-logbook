import * as t from 'io-ts';
import {ExtraRequestProps, request} from "./common";
import config from "../config";


const ResponseType = t.type({
    token: t.string,
});

export function signIn({password, ...extraProps}: { password: string } & ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/sign`,
        ioType: ResponseType,
        jsonBody: {password},
        method: 'post',
        ...extraProps,
    });
}

export function refreshToken(props?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/refreshToken`,
        ioType: ResponseType,
        method: 'post',
        jsonBody: {},
        ...props,
    });
}
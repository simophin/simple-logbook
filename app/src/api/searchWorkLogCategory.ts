import {ExtraRequestProps, request} from "./common";
import * as t from 'io-ts';
import config from "../config";
import {NonEmptyString} from "io-ts-types";

const requestType = t.partial({
    q: t.string,
});

const responseType = t.array(NonEmptyString);

export default function searchWorkLogCategory({q}: t.TypeOf<typeof requestType>, extraProps?: ExtraRequestProps) {
    let url = `${config.baseUrl}/workLogs/categories`;
    if (q) {
        url += `?q=${encodeURIComponent(q)}`;
    }

    return request({
        url,
        method: 'get',
        outputType: responseType,
        ...extraProps,
    });
}
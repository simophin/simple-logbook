import {ExtraRequestProps, request} from "./common";
import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import config from "../config";

const uploadResultType = t.type({
    id: codec.NonEmptyString,
});

export default function uploadAttachment(file: File, extraProps?: ExtraRequestProps) {
    const body = new FormData();
    body.append("file", file, file.name);
    return request({
        url: `${config.baseUrl}/attachments`,
        method: 'post',
        rawBody: body,
        ioType: uploadResultType,
        ...extraProps,
    });
}
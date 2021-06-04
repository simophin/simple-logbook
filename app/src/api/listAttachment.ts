import {ExtraRequestProps, request} from "./common";
import config from "../config";
import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {zonedDateTimeType} from "./codecs";

const attachmentSummaryType = t.type({
    id: codec.NonEmptyString,
    name: codec.NonEmptyString,
    mimeType: codec.NonEmptyString,
    created: zonedDateTimeType,
    lastUpdated: zonedDateTimeType,
});

const responseType = t.type({
    data: t.array(attachmentSummaryType),
    total: t.number,
});

const requestType = t.type({
    includes: t.array(t.string),
})

export default function listAttachments(ids: string[], extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/attachments/list`,
        method: 'post',
        inputType: requestType,
        body: {includes: ids},
        outputType: responseType,
        ...extraProps,
    })
}
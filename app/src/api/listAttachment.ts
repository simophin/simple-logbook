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


export default function listAttachments(ids: string[], extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/attachments/list`,
        method: 'post',
        jsonBody: {ids},
        ioType: t.array(attachmentSummaryType),
        ...extraProps,
    })
}
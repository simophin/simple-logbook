import {ExtraRequestProps, request} from "./common";
import config from "../config";
import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {zonedDateTimeType} from "./codecs";
import { commonListFilterType } from "./commonList";

const attachmentSummaryType = t.type({
    id: codec.NonEmptyString,
    name: codec.NonEmptyString,
    mimeType: codec.NonEmptyString,
    created: zonedDateTimeType,
    lastUpdated: zonedDateTimeType,
    signedId: codec.NonEmptyString,
});

export type AttachmentSummary = t.TypeOf<typeof attachmentSummaryType>;

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

const searchFilterType = t.union(
    [
        t.partial({
            accounts: t.array(t.string),
        }), 
        commonListFilterType
    ]);

type SearchFilter = t.TypeOf<typeof searchFilterType>;

export function searchAttachments(filter: SearchFilter, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/attachments/list`,
        method: 'post',
        inputType: searchFilterType,
        body: filter,
        outputType: responseType,
        ...extraProps,
    })
}

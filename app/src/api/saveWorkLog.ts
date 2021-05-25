import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {currencyType, zonedDateTimeType} from "./codecs";
import {ExtraRequestProps, request} from "./common";
import config from "../config";

export const workLogType = t.type({
    id: codec.NonEmptyString,
    category: codec.NonEmptyString,
    subCategory: t.string,
    description: codec.NonEmptyString,
    unitPrice: currencyType,
    unit: currencyType,
    created: zonedDateTimeType,
    attachments: t.array(codec.NonEmptyString),
});

export type WorkLog = t.TypeOf<typeof workLogType>;

export default function saveWorkLog(data: WorkLog, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/workLogs`,
        method: 'post',
        inputType: workLogType,
        body: data,
        outputType: t.unknown,
        ...extraProps,
    });
}
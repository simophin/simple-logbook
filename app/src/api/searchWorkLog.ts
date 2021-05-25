import {ExtraRequestProps, request} from "./common";
import * as t from 'io-ts';
import {zonedDateTimeType} from "./codecs";
import config from "../config";
import {workLogType} from "./saveWorkLog";

const filterType = t.partial({
    q: t.string,
    from: zonedDateTimeType,
    to: zonedDateTimeType,
    categories: t.array(t.string),
    subCategories: t.array(t.string),
    limit: t.number,
    offset: t.number,
});

export type Filter = t.TypeOf<typeof filterType>;


const responseType = t.type({
    data: t.array(workLogType),
    total: t.number,
    limit: t.number,
    offset: t.number,
});

export default function searchWorkLog(filter: Filter, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/workLogs/search`,
        inputType: filterType,
        body: filter,
        method: 'post',
        outputType: responseType,
        ...extraProps,
    });
}
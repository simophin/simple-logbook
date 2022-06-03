import * as t from 'io-ts';
import { ExtraRequestProps, request } from "./common";
import config from "../config";
import { commonListFilterType } from './commonList';
import { tagArrayType } from '../models/Tag';

const filterType = commonListFilterType;

export type Filter = t.TypeOf<typeof filterType>;

const responseType = t.type({
    total: t.number,
    data: tagArrayType,
});;

export function listTag(filter: Filter = {}, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/tags/list`,
        method: 'post',
        inputType: filterType,
        body: filter,
        outputType: responseType,
        ...extraProps,
    })
}

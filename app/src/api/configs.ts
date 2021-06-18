import * as t from 'io-ts';
import {ExtraRequestProps, request} from "./common";
import c from '../config';


const configType = t.type({
    name: t.string,
    value: t.union([t.string, t.null]),
});

export type Config = t.TypeOf<typeof configType>;

export function save(config: Config, extraProps?: ExtraRequestProps) {
    return request({
        url: `${c.baseUrl}/config`,
        method: 'post',
        body: config,
        inputType: configType,
        outputType: t.unknown,
        ...extraProps
    });
}

export function get(name: string, extraProps?: ExtraRequestProps) {
    return request({
        url: `${c.baseUrl}/config?name=${name}`,
        method: 'get',
        outputType: configType,
        ...extraProps
    });
}
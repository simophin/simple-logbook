import {ExtraRequestProps, request} from "./common";
import * as t from 'io-ts';
import config from "../config";


export default function getAttachment(id: string, preview: boolean, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/attachment?id=${encodeURIComponent(id)}&preview=${preview}`,
        method: 'get',
        outputType: t.unknown,
        ...extraProps
    })
}

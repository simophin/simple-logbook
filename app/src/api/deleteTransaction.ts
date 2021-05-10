import {ExtraRequestProps, request} from "./common";
import * as t from 'io-ts';
import config from "../config";
import {map} from "rxjs/operators";

const responseType = t.type({
    numDeleted: t.number,
});

export default function deleteTransaction({id, ...extraProps}: { id: string } & ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/transactions`,
        method: 'delete',
        body: [id],
        ioType: responseType,
        ...extraProps,
    }).pipe(map(({numDeleted}) => numDeleted > 0));
}
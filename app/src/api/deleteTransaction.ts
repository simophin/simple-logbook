import {ExtraRequestProps, request} from "./common";
import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import config from "../config";
import {map} from "rxjs/operators";

const responseType = t.type({
    numDeleted: t.number,
});

const requestType = t.array(codec.NonEmptyString);

export default function deleteTransaction({id}: { id: string }, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/transactions`,
        method: 'delete',
        inputType: requestType,
        body: [id as codec.NonEmptyString],
        outputType: responseType,
        ...extraProps,
    }).pipe(map(({numDeleted}) => numDeleted > 0));
}

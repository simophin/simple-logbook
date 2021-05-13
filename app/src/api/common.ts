import {Observable} from "rxjs";
import {isLeft} from "fp-ts/Either";
import {PathReporter} from "io-ts/PathReporter";
import {Any, default as t} from "io-ts";
import axios from "axios";

export type ExtraRequestProps = {
    headers?: object,
}

type RequestProps<IOType extends Any> = {
    url: string,
    method: "get" | "post" | "delete" | "put",
    ioType: IOType,
    body?: object,
} & ExtraRequestProps;

export function request<IOType extends Any>({
                                                url,
                                                method,
                                                ioType,
                                                body,
                                                headers = {},
                                            }: RequestProps<IOType>): Observable<t.TypeOf<IOType>> {
    return new Observable((sub) => {
            const source = axios.CancelToken.source();
            axios.request({
                url,
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...headers,
                },
                data: body ? JSON.stringify(body) : undefined,
                cancelToken: source.token,
            }).then((res) => {
                const data = ioType.decode(res.data);
                if (isLeft(data)) {
                    sub.error({name: 'invalid_data', message: JSON.stringify(PathReporter.report(data))} as Error);
                } else {
                    sub.next(data.right);
                    sub.complete();
                }
            }).catch((err) => {
                if (!axios.isCancel(err)) {
                    sub.error({name: 'unknown_error', message: 'unknown_error', ...err});
                }
            });

            return () => source.cancel();
        }
    );
}
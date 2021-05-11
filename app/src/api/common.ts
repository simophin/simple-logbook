import {Observable} from "rxjs";
import {isLeft} from "fp-ts/Either";
import {PathReporter} from "io-ts/PathReporter";
import {Any, default as t} from "io-ts";

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
            const controller = new AbortController();
            (async () => {
                try {
                    const res = await fetch(url, {
                        method,
                        headers: {
                            "Content-Type": "application/json",
                            ...headers,
                        },
                        signal: controller.signal,
                        redirect: 'follow',
                        body: body ? JSON.stringify(body) : undefined,
                    });

                    if (res.ok) {
                        const data = ioType.decode(await res.json());
                        if (isLeft(data)) {
                            sub.error({name: 'invalid_data', message: JSON.stringify(PathReporter.report(data))} as Error);
                        } else {
                            sub.next(data.right);
                            sub.complete();
                        }
                    } else {
                        sub.error({name: 'http_error', code: res.status, message: res.statusText} as Error);
                    }
                } catch (e) {
                    if (!controller.signal.aborted) {
                        sub.error({name: 'unknown_error', message: 'unknown', cause: e} as Error);
                    }
                }
            })();

            return () => controller.abort();
        }
    )
}
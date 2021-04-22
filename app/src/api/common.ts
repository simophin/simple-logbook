import {Observable} from "rxjs";
import {isLeft} from "fp-ts/Either";
import {PathReporter} from "io-ts/PathReporter";
import {Type} from "io-ts";

export function request<T>({
                               url,
                               method,
                               ioType,
                               body
                           }: { url: string, method: "get" | "post" | "delete" | "put", ioType: Type<T>, body?: object }): Observable<T> {
    return new Observable<T>((sub) => {
            const controller = new AbortController();
            (async () => {
                try {
                    const res = await fetch(url, {
                        method,
                        headers: {
                            "Content-Type": "application/json",
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
                    sub.error({name: 'unknown_error', ...e} as Error);
                }
            })();

            sub.add(() => controller.abort())
        }
    )
}
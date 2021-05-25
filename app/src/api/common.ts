import {Observable} from "rxjs";
import {isLeft} from "fp-ts/Either";
import {PathReporter} from "io-ts/PathReporter";
import {Any, default as t} from "io-ts";
import axios from "axios";

export type ExtraRequestProps = {
    headers?: object,
}

interface CommonProps {
    url: string,
    method: "get" | "post" | "delete" | "put",
}

interface WithOutputType<OutputType extends Any> extends CommonProps {
    outputType: OutputType,
}

interface WithInputType<InputType extends Any> extends CommonProps {
    inputType: InputType,
    body: t.TypeOf<InputType>,
}

interface RawInputType extends CommonProps {
    rawBody?: any,
}

type RequestProps<OutputType extends Any, InputType extends Any> = WithOutputType<OutputType>
    & (WithInputType<InputType> | RawInputType)
    & ExtraRequestProps;

export function request<OutputType extends Any = Any,
    InputType extends Any = Any>(props: RequestProps<OutputType, InputType>): Observable<t.TypeOf<OutputType>> {
    return new Observable((sub) => {
            const source = axios.CancelToken.source();
            let contentType: string | undefined;
            let data;

            if ("inputType" in props) {
                contentType = 'application/json';
                data = JSON.stringify(props.inputType.encode(props.body));
            } else {
                data = props.rawBody;
            }

            axios.request({
                url: props.url,
                method: props.method,
                headers: {
                    "Content-Type": contentType,
                    ...props.headers,
                },
                data,
                cancelToken: source.token,
            }).then((res) => {
                const data = props.outputType.decode(res.data);
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
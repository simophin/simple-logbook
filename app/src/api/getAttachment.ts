import {ExtraRequestProps} from "./common";
import config from "../config";
import {Observable} from "rxjs";


export default function getAttachment(id: string, extraProps?: ExtraRequestProps)
{
    return new Observable<Blob>((subscriber) => {
        const controller = new AbortController();
        fetch(`${config.baseUrl}/attachments?id=${id}`, {
            headers: extraProps ? new Headers(extraProps.headers as Record<string, string>) : undefined,
            method: 'get',
            signal: controller.signal,
        }).then((resp) => resp.blob())
            .then((result) => subscriber.next(result))
            .catch(e => subscriber.error(e))
            .finally(() => subscriber.complete());

        subscriber.add(() => controller.abort());
    });
}
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import listAttachments from "../api/listAttachment";
import useAuthProps, {useAuthToken} from "../hooks/useAuthProps";
import React, {CSSProperties, useMemo} from "react";
import config from "../config";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import {Image} from "react-bootstrap";

type Props = { id: string, style?: CSSProperties } & React.ComponentProps<any>;

export default function AttachmentItem({id, ...reactProps}: Props) {
    const props = useAuthProps();
    const data = useObservable(() => listAttachments([id], props), [id, props]);
    useObservableErrorReport(data);
    const summary = getLoadedValue(data)?.data?.[0];
    const token = useAuthToken();
    const mimeType = summary?.mimeType;
    const isImage = mimeType?.startsWith('image/') === true;

    const imageUrl = useMemo(() => {
        if (isImage) {
            let url = `${config.baseUrl}/attachments?id=${encodeURIComponent(id)}`;
            if (token) {
                url += `&token=${encodeURIComponent(token)}`;
            }
            return url;
        }
    }, [id, isImage, token]);

    return <div {...reactProps}>
        {imageUrl && <Image alt={summary?.name}
                            style={{width: 150, height: 150, objectFit: 'contain'}}
                            thumbnail={true}
                            src={imageUrl}/>}
        {mimeType && !isImage && <span>Type: {mimeType}</span>}
        {data.type === 'loading' && <span>Loading...</span>}
    </div>
}
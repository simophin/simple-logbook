import {getLoadedValue, useObservable} from "../hooks/useObservable";
import listAttachments from "../api/listAttachment";
import useAuthProps, {useAuthToken} from "../hooks/useAuthProps";
import React, {CSSProperties, useMemo} from "react";
import config from "../config";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import {Figure} from "react-bootstrap";

type Props = { id: string, style?: CSSProperties } & React.ComponentProps<any>;

const captionStyle: CSSProperties = {
    maxLines: 1,
    blockOverflow: 'ellipsis',
    width: 150,
    lineBreak: 'anywhere'
};

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
        {imageUrl &&
        <Figure>
            <a href={imageUrl} target='_blank' rel='noreferrer'>
                <Figure.Image alt={summary?.name}
                              style={{width: 150, height: 150, objectFit: 'contain'}}
                              thumbnail={true}
                              src={imageUrl}/>
            </a>
            <Figure.Caption
                as='div'
                style={captionStyle}>
                {summary?.name}
            </Figure.Caption>
        </Figure>
        }
        {mimeType && !isImage && <span>Type: {mimeType}</span>}
    </div>
}
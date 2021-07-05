import {getLoadedValue, useObservable} from "../hooks/useObservable";
import listAttachments from "../api/listAttachment";
import useAuthProps, {useAuthToken} from "../hooks/useAuthProps";
import React, {CSSProperties, useMemo, useState} from "react";
import config from "../config";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import {flexContainer} from "../styles/common";
import {Button} from "react-bootstrap";
import {TrashIcon} from "@primer/octicons-react";

type Props = {
    id: string,
    style?: CSSProperties,
    onDelete?: (id: string) => unknown,
} & React.ComponentProps<'div'>;

const squared: CSSProperties = {
    width: 120,
    height: 120,
};

const commonOverlay: CSSProperties = {
    width: '100%',
    position: 'absolute',
    fontSize: 11,
    padding: 4,
};

export default function AttachmentItem({id, onDelete, ...reactProps}: Props) {
    const props = useAuthProps();
    const data = useObservable(() => listAttachments([id], props), [id, props]);
    useObservableErrorReport(data);
    const summary = getLoadedValue(data)?.data?.[0];
    const token = useAuthToken();
    const [showingOptions, setShowingOptions] = useState(false);

    const link = useMemo(() => {
        let url = `${config.baseUrl}/attachments?id=${encodeURIComponent(id)}`;
        if (token) {
            url += `&token=${encodeURIComponent(token)}`;
        }
        return url;
    }, [id, token]);

    return <div {...reactProps}>
        <div style={{
            position: 'relative',
            border: '1px solid #dee2e6',
            borderRadius: '0.25rem',
        }}
             onMouseEnter={() => setShowingOptions(!!onDelete)}
             onMouseLeave={() => setShowingOptions(false)}
             title={summary?.name}>

            <a href={link}
               style={{
                   display: 'flex',
                   justifyContent: 'center',
                   justifyItems: 'center',
                   ...squared,
               }}
               target='_blank'
               rel='noreferrer'>
                <img alt={summary?.name}
                     style={{...squared, objectFit: 'contain', textAlign: 'center', lineHeight: squared.height}}
                     src={`${link}&preview=true`}/>
            </a>

            <div
                className='text-center'
                style={{
                    ...commonOverlay,
                    color: 'white',
                    background: 'rgba(0, 0, 0, 0.5)',
                    bottom: 0,
                    ...flexContainer,
                }}>
                <span style={{
                    flex: 1,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    lineHeight: '2em',
                    maxHeight: '2em'
                }}>
                    {summary?.name}
                </span>
            </div>

            {showingOptions && <div style={{...commonOverlay, top: 0, display: 'flex', justifyContent: 'right'}}>
                {onDelete && <Button size='sm' variant='danger' style={{marginLeft: 4}} onClick={() => onDelete(id)}>
                    <TrashIcon size={16}/>
                </Button>}
            </div>}
        </div>

    </div>
}
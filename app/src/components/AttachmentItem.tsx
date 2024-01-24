import { AttachmentSummary } from "../api/listAttachment";
import React, { CSSProperties, useMemo, useState } from "react";
import config from "../config";
import { flexContainer } from "../styles/common";
import { Button } from "react-bootstrap";
import { TrashIcon } from "@primer/octicons-react";

type Props = {
    attachment: AttachmentSummary,
    style?: CSSProperties,
    onDelete?: (id: AttachmentSummary['id']) => unknown,
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

export default function AttachmentItem({ attachment, onDelete, ...reactProps }: Props) {
    const [showingOptions, setShowingOptions] = useState(false);
    const { signedId, name, mimeType, id } = attachment;

    const link = `${config.baseAttachmentUrl}/${encodeURIComponent(signedId)}`;

    const extName = useMemo(() => {
        const dotIndex = name.lastIndexOf('.') ?? -1;
        if (dotIndex >= 0) {
            return name.slice(dotIndex + 1) ?? '';
        } else {
            return '';
        }
    }, [name]);


    const previewElement = useMemo(() => {
        if (mimeType.startsWith("image/") || mimeType.startsWith("application/pdf")) {
            return <img alt={name}
                style={{ ...squared, objectFit: 'contain', textAlign: 'center', lineHeight: squared.height }}
                src={`${link}?preview=300`} />
        }
        else {
            return <span>{extName}</span>
        }
    }, [mimeType, name, link, extName]);

    return <div {...reactProps}>
        <div style={{
            position: 'relative',
            border: '1px solid #dee2e6',
            borderRadius: '0.25rem',
        }}
            onMouseEnter={() => setShowingOptions(!!onDelete)}
            onMouseLeave={() => setShowingOptions(false)}
            title={name}>

            <a href={link}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    justifyItems: 'center',
                    ...squared,
                }}
                target='_blank'
                rel='noreferrer'>
                {previewElement}
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
                    {name}
                </span>
            </div>

            {showingOptions && <div style={{ ...commonOverlay, top: 0, display: 'flex', justifyContent: 'right' }}>
                {onDelete && <Button size='sm' variant='danger' style={{ marginLeft: 4 }} onClick={() => onDelete(id)}>
                    <TrashIcon size={16} />
                </Button>}
            </div>}
        </div>

    </div>
}

import _ from "lodash";
import { useCallback, useMemo, useRef, useState } from "react";
import { map } from "rxjs/operators";
import listAttachments, { AttachmentSummary } from "../api/listAttachment";
import uploadAttachment from "../api/uploadAttachment";
import useAuthProps from "../hooks/useAuthProps";
import { getLoadedValue, useObservable } from "../hooks/useObservable";
import { flexContainer, flexFullLineItem, flexItem } from "../styles/common";
import AttachmentItem from "./AttachmentItem";

type AttachmentId = AttachmentSummary['id'];

type Props = {
    value: AttachmentId[],
    onChange?: (value: AttachmentId[]) => unknown,
    readonly?: boolean
}

export default function AttachmentSelect({ value, onChange, readonly }: Props) {
    const onDelete = useCallback((id: AttachmentId) => {
        if (!onChange) {
            return;
        }

        const found = value.indexOf(id);
        if (found >= 0) {
            onChange([...value.slice(0, found), ...value.slice(found + 1)]);
        }
    }, [value, onChange]);
    const authProps = useAuthProps();

    const attachments = useObservable(() => {
        return listAttachments(value, authProps)
            .pipe(map(v => v.data.sort((lhs, rhs) => lhs.lastUpdated.compareTo(rhs.lastUpdated))));
    }, [value, authProps]);

    const children = useMemo(() => getLoadedValue(attachments)?.map(a =>
        <AttachmentItem key={a.id} attachment={a} style={flexItem}
            onDelete={readonly === true ? undefined : onDelete}
        />) ?? [],
        [onDelete, readonly, attachments]);

    const fileRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);


    const handleUpload = async () => {
        if (!onChange) {
            return;
        }
        
        const files = fileRef.current?.files;
        if (!files) {
            return;
        }

        setUploading(true);
        try {
            const result = await Promise.all(_.map(files, (f) => uploadAttachment(f, authProps).toPromise()));
            let newValues = [...value];
            for (const { id } of result) {
                if (newValues.indexOf(id) < 0) {
                    onChange(newValues = [...newValues, id]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
            if (fileRef.current) {
                fileRef.current.value = '';
            }
        }
    };

    return <div style={flexContainer}>
        {children}
        {readonly !== true && <input type="file"
            style={flexFullLineItem}
            onChange={handleUpload}
            disabled={uploading}
            multiple
            ref={fileRef} />
        }
    </div>;
}
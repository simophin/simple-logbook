import {useCallback, useMemo, useRef, useState} from "react";
import AttachmentItem from "./AttachmentItem";
import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import useAuthProps from "../hooks/useAuthProps";
import uploadAttachment from "../api/uploadAttachment";
import _ from "lodash";

type AttachmentId = string;

type Props = {
    value: AttachmentId[],
    onChange: (value: AttachmentId[]) => unknown,
}

export default function AttachmentSelect({value, onChange}: Props) {
    const onDelete = useCallback((id: string) => {
        const found = value.indexOf(id);
        if (found >= 0) {
            onChange([...value.slice(0, found), ...value.slice(found + 1)]);
        }
    }, [value, onChange]);

    const children = useMemo(() => value.map(id =>
            <AttachmentItem key={id} id={id} style={flexItem}
                onDelete={onDelete}
            />),
        [onDelete, value]);

    const fileRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const authProps = useAuthProps();

    const handleUpload = async () => {
        const files = fileRef.current?.files;
        if (!files) {
            return;
        }

        setUploading(true);
        try {
            const result = await Promise.all(_.map(files, (f) => uploadAttachment(f, authProps).toPromise()));
            let newValues = [...value];
            for (const {id} of result) {
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
        <input type="file"
               style={flexFullLineItem}
               onChange={handleUpload}
               disabled={uploading}
               multiple
               ref={fileRef}/>

    </div>;
}
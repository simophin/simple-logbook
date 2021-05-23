import {useMemo, useRef, useState} from "react";
import AttachmentItem from "./AttachmentItem";
import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import useAuthProps from "../hooks/useAuthProps";
import uploadAttachment from "../api/uploadAttachment";

type AttachmentId = string;

type Props = {
    value: AttachmentId[],
    onChange: (value: AttachmentId[]) => unknown,
}

export default function AttachmentSelect({value, onChange}: Props) {
    const children = useMemo(() => value.map(id =>
            <AttachmentItem key={id} id={id} style={flexItem}/>),
        [value]);

    const fileRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const authProps = useAuthProps();

    const handleUpload = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) {
            return;
        }

        setUploading(true);
        try {
            const {id} = await uploadAttachment(file, authProps).toPromise();
            if (value.indexOf(id) < 0) {
                onChange([...value, id]);
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
               ref={fileRef}/>
    </div>;
}
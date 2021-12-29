import { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { NEVER } from "rxjs";
import { searchAttachments } from "../api/listAttachment";
import AttachmentItem from "../components/AttachmentItem";
import MultiFilter, { Filter } from "../components/MultiFilter";
import Paginator from "../components/Paginator";
import useAuthProps from "../hooks/useAuthProps";
import { getLoadedValue, useObservable } from "../hooks/useObservable";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import { flexContainer, flexFullLineItem, flexItem } from "../styles/common";


export default function AttachmentListPage() {
    const authProps = useAuthProps();
    const [currentPage, setCurrentPage] = useState<number>();
    const [pageSize, setPageSize] = useState<number>();
    const [filter, setFilter] = useState<Filter>({});
    const attachments = useObservable(() => {
        return (pageSize === undefined || currentPage === undefined) ? NEVER
            : searchAttachments({
                ...filter,
                offset: pageSize * currentPage,
                limit: pageSize
            }, authProps);
    }, [authProps, currentPage, filter, pageSize]);
    useObservableErrorReport(attachments);

    const attachmentItems = useMemo(() => getLoadedValue(attachments)?.data
        ?.map((a) => <AttachmentItem attachment={a} style={flexItem} />)
        ?? [],
        [attachments]);

    return <div style={flexContainer}>
        <Helmet><title>Attachment list</title></Helmet>
        <div style={flexFullLineItem}>
            <MultiFilter onChanged={setFilter} />
        </div>

        {getLoadedValue(attachments)?.total === 0 && <div style={flexFullLineItem}>
            No attachments found
        </div>}

        <div style={{ ...flexFullLineItem, ...flexContainer, justifyContent: 'start' }}>
            {attachmentItems}
        </div>

        <div style={flexFullLineItem}>
            <Paginator
                onChange={(pageIndex, pageSize) => {
                    setCurrentPage(pageIndex);
                    setPageSize(pageSize);
                }}
                totalItemCount={getLoadedValue(attachments)?.total ?? 0}
            />
        </div>
    </div>
}

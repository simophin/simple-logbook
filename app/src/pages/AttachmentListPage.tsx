import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import {InputGroup} from "react-bootstrap";
import {ProjectIcon, SearchIcon} from "@primer/octicons-react";
import {useMemo, useState} from "react";
import ValueFormControl from "../components/ValueFormControl";
import AccountSelect from "../components/AccountSelect";
import {Helmet} from "react-helmet";
import {useMediaPredicate} from "react-media-hook";
import useAuthProps from "../hooks/useAuthProps";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import {searchAttachments} from "../api/listAttachment";
import MultiFilter, {Filter} from "../components/MultiFilter";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import Paginator from "../components/Paginator";
import AttachmentSelect from "../components/AttachmentSelect";
import AttachmentItem from "../components/AttachmentItem";


export default function AttachmentListPage() {
    const authProps = useAuthProps();
    const [currentPage, setCurrentPage] = useState(0);
    const [filter, setFilter] = useState<Filter>({});
    const [pageSize, setPageSize] = useState(40);
    const attachments = useObservable(() => {
        return searchAttachments({
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

        <div style={{...flexFullLineItem, ...flexContainer, justifyContent: 'start'}}>
            {attachmentItems}
        </div>

        <div style={flexFullLineItem}>
            <Paginator onChange={setCurrentPage}
                       currentPage={currentPage}
                       totalItemCount={getLoadedValue(attachments)?.total ?? 0}
                       pageSize={pageSize} />
        </div>
    </div>
}

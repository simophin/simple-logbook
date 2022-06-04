import { useContext, useMemo, useState } from "react";
import { Table } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Sort } from "../api/commonList";
import { listTag } from "../api/listTag";
import Paginator from "../components/Paginator";
import SortColumn from "../components/SortColumn";
import useAuthProps from "../hooks/useAuthProps";
import { getLoadedValue, useObservable } from "../hooks/useObservable";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import { AppStateContext } from "../state/AppStateContext";
import { flexFullLineItem } from "../styles/common";
import { formatAsLocaleLocalDate } from "../utils/dates";
import { formatAsCurrency } from "../utils/numeric";


export default function TagListPage() {
    const [sort, setSort] = useState<Sort>();
    const authProps = useAuthProps();
    const { transactionUpdatedTime } = useContext(AppStateContext);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const tags = useObservable(() => listTag({
        sorts: sort ? [sort] : undefined,
        limit: pageSize,
        offset: page * pageSize,
    }, authProps), [authProps, transactionUpdatedTime, sort, pageSize, page]);
    useObservableErrorReport(tags);

    const children = useMemo(() => {
        return (getLoadedValue(tags)?.data ?? []).map(({ tag, numTx, total, lastUpdated }) => <tr>
            <td><Link to={`/transactions?tag=${encodeURIComponent(tag)}`}>{tag}</Link></td>
            <td>{numTx}</td>
            <td>{formatAsCurrency(total)}</td>
            <td>{formatAsLocaleLocalDate(lastUpdated)}</td>
        </tr>);
    }, [tags]);

    return <div>
        <Helmet>Tags</Helmet>
        {getLoadedValue(tags)?.data?.length === 0 && 'No tags found'}

        <div style={flexFullLineItem}>
            <Table hover striped bordered size='sm'>
                <thead>
                    <tr>
                        <th>
                            <SortColumn label='Tag'
                                order={sort?.field === 'tag' ? sort.order : undefined}
                                onChanged={order => setSort(order ? { field: 'tag', order } : undefined)}
                            />
                        </th>
                        <th>
                            <SortColumn label='No. of transactions'
                                order={sort?.field === 'numTx' ? sort.order : undefined}
                                onChanged={order => setSort(order ? { field: 'numTx', order } : undefined)}
                            />
                        </th>
                        <th>
                            <SortColumn label='Total amount'
                                order={sort?.field === 'total' ? sort.order : undefined}
                                onChanged={order => setSort(order ? { field: 'total', order } : undefined)}
                            />
                        </th>
                        <th>
                            <SortColumn label='Last updated'
                                order={sort?.field === 'lastUpdated' ? sort.order : undefined}
                                onChanged={order => setSort(order ? { field: 'lastUpdated', order } : undefined)}
                            />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {tags.type === 'loading' &&
                        <tr><td colSpan={4} align="center">Loading...</td></tr>}
                    {children}
                </tbody>
            </Table>
        </div>

        <Paginator
            onChange={(page, size) => {
                setPage(page);
                setPageSize(size);
            }}
            totalItemCount={getLoadedValue(tags)?.total ?? 0} />
    </div>
}
import { deleteInvoice, listInvoice } from "../api/invoices";
import { getLoadedValue, useObservable } from "../hooks/useObservable";
import useAuthProps from "../hooks/useAuthProps";
import { ReactElement, useCallback, useContext, useMemo, useState } from "react";
import { LocalDate, ZonedDateTime } from "@js-joda/core";
import { flexContainer, flexFullLineItem, flexItem } from "../styles/common";
import { InputGroup, Table } from "react-bootstrap";
import ValueFormControl from "./ValueFormControl";
import { useDebounce } from "../hooks/useDebounce";
import { formatAsLocaleLocalDate } from "../utils/dates";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import { formatAsCurrency } from "../utils/numeric";
import { LinkContainer } from "react-router-bootstrap";
import currency from "currency.js";
import AsyncConfirm from "./AsyncConfirm";
import { throwError } from "rxjs";
import { AppStateContext } from "../state/AppStateContext";
import { tap } from "rxjs/operators";
import { FileIcon, PencilIcon, SearchIcon, TrashIcon } from "@primer/octicons-react";
import Paginator from "./Paginator";


const OpButton = ({ children, ...props }: { children: ReactElement, title?: string, onClick?: () => unknown, }) =>
    <span {...props}
        style={{ padding: 2 }}
        role='button'>
        {children}
    </span>;

export default function InvoiceListView() {
    const [searchTerm, setSearchTerm] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const pageSize = 20;
    const [page, setPage] = useState(0);

    const authProps = useAuthProps();
    const { transactionUpdatedTime, reportTransactionUpdated } = useContext(AppStateContext);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const rows = useObservable(() => listInvoice({
        q: debouncedSearchTerm.trim(),
        from: from.length > 0 ? LocalDate.parse(from) : undefined,
        to: to.length > 0 ? LocalDate.parse(to) : undefined,
        limit: pageSize,
        offset: page * pageSize,
    }, authProps), [authProps, debouncedSearchTerm, from, to, page, transactionUpdatedTime]);
    useObservableErrorReport(rows);

    const [pendingDelete, setPendingDelete] = useState<{ id: string, client: string, date: ZonedDateTime, amount: currency }>();
    const handleConfirmDeletion = useCallback(() => {
        if (!pendingDelete) {
            return throwError({ message: 'Nothing to delete' });
        }
        return deleteInvoice([pendingDelete.id])
            .pipe(tap(reportTransactionUpdated));
    }, [pendingDelete, reportTransactionUpdated]);

    const invoiceTable = useMemo(() => {
        const data = getLoadedValue(rows)?.data;
        return data && <Table responsive hover striped bordered size='sm'>
            <thead>
                <tr>
                    <th>No.</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th />
                </tr>
            </thead>
            <tbody>
                {data?.map(({ id, reference, client, date, amount }) => {
                    return <tr key={reference}>
                        <td>{reference}</td>
                        <td><a href={`/invoice/view/${id}?fullScreen=true`} target='_blank' rel="noreferrer">{client}</a>
                        </td>
                        <td>{formatAsLocaleLocalDate(date)}</td>
                        <td>{formatAsCurrency(amount)}</td>
                        <td width={100} align='center'>
                            <LinkContainer to={`/invoice/edit/${id}`}>
                                <OpButton title='Edit'><PencilIcon size={14} /></OpButton>
                            </LinkContainer>&nbsp;

                            <LinkContainer to={`/invoice/add?copyFrom=${id}`}>
                                <OpButton title='Make a copy'><FileIcon size={14} /></OpButton>
                            </LinkContainer>&nbsp;

                            <OpButton title='Delete' onClick={() => setPendingDelete({ client, id, date, amount })}>
                                <TrashIcon className='text-danger' size={14} />
                            </OpButton>&nbsp;
                        </td>
                    </tr>;
                })}
                {data.length === 0 && <tr>
                    <td colSpan={5} align='center'>No data found</td>
                </tr>}
            </tbody>
        </Table>
    }, [rows]);

    return <div style={flexContainer}>
        <InputGroup style={{ ...flexItem }} size='sm'>
            <InputGroup.Text><SearchIcon size={14} /></InputGroup.Text>
            <ValueFormControl value={searchTerm}
                placeholder='Search text'
                onValueChange={setSearchTerm} />
        </InputGroup>
        

        <span style={{ ...flexItem, flex: 1 }}>
            <InputGroup size='sm'>
                <InputGroup.Text>From</InputGroup.Text>
                <ValueFormControl value={from}
                    type='date'
                    onValueChange={setFrom} />
            </InputGroup>
        </span>


        <span style={{ ...flexItem, flex: 1 }}>
            <InputGroup size='sm'>
                <InputGroup.Text>To</InputGroup.Text>
                <ValueFormControl value={to}
                    type='date'
                    onValueChange={setTo} />
            </InputGroup>
        </span>

        <div style={flexFullLineItem}>
            {invoiceTable}
        </div>

        <Paginator totalItemCount={getLoadedValue(rows)?.total ?? 0}
            onChange={setPage}
            currentPage={page}
            pageSize={pageSize} />

        {pendingDelete &&
            <AsyncConfirm body={`Are you sure to delete this invoice? 
            ${pendingDelete.client}, on ${formatAsLocaleLocalDate(pendingDelete.date)}, ${formatAsCurrency(pendingDelete.amount)}`}
                doConfirm={handleConfirmDeletion}
                onConfirmed={() => setPendingDelete(undefined)}
                onCancel={() => setPendingDelete(undefined)}
                confirmInProgressText='Deleting' />
        }
    </div>;
}
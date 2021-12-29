import { convert, ZoneId } from '@js-joda/core';
import { FoldUpIcon, PencilIcon, TrashIcon } from "@primer/octicons-react";
import { Fragment, useCallback, useContext, useMemo, useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { useMediaPredicate } from "react-media-hook";
import deleteTransaction from "../api/deleteTransaction";
import { listTransaction } from "../api/listTransaction";
import AsyncConfirm from "../components/AsyncConfirm";
import AttachmentSelect from "../components/AttachmentSelect";
import MultiFilter, { Filter } from "../components/MultiFilter";
import Paginator from "../components/Paginator";
import TransactionEntry from "../components/TransactionEntry";
import useAuthProps from "../hooks/useAuthProps";
import { getLoadedValue, useObservable } from "../hooks/useObservable";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import { Transaction } from "../models/Transaction";
import { AppStateContext } from "../state/AppStateContext";
import { flexContainer, flexFullLineItem, flexItem } from "../styles/common";
import { EditState } from "../utils/EditState";
import { formatAsCurrency } from "../utils/numeric";
import SortedArray from "../utils/SortedArray";

type TransactionId = Transaction['id'];

type Props = {
    accounts?: string[],
};

export default function TransactionListPage({accounts: showAccounts = []}: Props) {
    const [page, setPage] = useState(0);
    const [pageSize] = useState(20);
    const bigScreen = useMediaPredicate('(min-width: 800px)');
    const [filter, setFilter] = useState<Filter>();

    const {transactionUpdatedTime, reportTransactionUpdated} = useContext(AppStateContext);
    const authProps = useAuthProps();

    const rows = useObservable(() =>
            listTransaction({
                offset: pageSize * page,
                limit: pageSize,
                accounts: filter?.accounts,
                q: filter?.q,
                from: filter?.from,
                to: filter?.to,
            }, authProps),
        [page, pageSize, authProps, transactionUpdatedTime, filter]);
    useObservableErrorReport(rows);

    const totalItemsCount = getLoadedValue(rows)?.total ?? 0;
    const numPages = Math.ceil(totalItemsCount / pageSize);

    if (numPages > 0 && page >= numPages) {
        setPage(numPages - 1);
    }

    const [selected, setSelected] = useState(new SortedArray<TransactionId>([]));


    const toggleExpanded = useCallback((id: TransactionId) => {
        const [newSelected, removed] = selected.remove(id);
        if (removed) {
            setSelected(newSelected);
        } else {
            setSelected(selected.insert(id));
        }
    }, [selected]);

    const children = useMemo(() => {
            return (getLoadedValue(rows)?.data ?? [])
                .map((r) => {
                    const isSelected = selected.has(r.id);
                    const transDate = convert(r.transDate, ZoneId.systemDefault()).toDate().toLocaleDateString();
                    return (
                        <Fragment key={`row-${r.id}`}>
                            <tr key={r.id}
                                onClick={() => toggleExpanded(r.id)}>
                                <td>{r.description}</td>
                                {bigScreen && <>
                                    <td>{r.fromAccount}</td>
                                    <td>{r.toAccount}</td>
                                </>}
                                <td>{formatAsCurrency(r.amount)}</td>
                                <td>{transDate}</td>
                            </tr>
                            {isSelected &&
                            <tr key={`expanded-${r.id}`} className='bg-light'>
                                <td colSpan={bigScreen ? 5 : 3}>
                                    <div style={flexContainer}>
                                        <div style={flexFullLineItem}><strong>From: </strong>{r.fromAccount}</div>
                                        <div style={flexFullLineItem}><strong>To: </strong>{r.toAccount}</div>
                                        <div style={flexFullLineItem}><strong>Amount: </strong>{formatAsCurrency(r.amount)}</div>
                                        <div style={flexFullLineItem}><strong>Transaction
                                            date: </strong>{transDate}</div>
                                        <div style={flexFullLineItem}><strong>Last
                                            updated: </strong>{convert(r.updatedDate).toDate().toLocaleString()}</div>

                                        <div style={{...flexFullLineItem, ...flexContainer}}>
                                            <AttachmentSelect readonly value={r.attachments} />
                                        </div>
                                        <div style={flexContainer}>
                                            <Button style={flexItem}
                                                    onClick={() => setEditState({state: 'edit', editing: r})}
                                                    size='sm'>
                                                <PencilIcon size='small'/>&nbsp;EDIT
                                            </Button>
                                            <Button style={flexItem}
                                                    onClick={() => setEditState({state: 'delete', deleting: r})}
                                                    size='sm'
                                                    variant='danger'>
                                                <TrashIcon size='small'/>&nbsp;DELETE
                                            </Button>
                                            <Button style={flexItem} size='sm' variant='secondary'
                                                    onClick={() => toggleExpanded(r.id)}>
                                                <FoldUpIcon size='small'/>&nbsp;Hide
                                            </Button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            }
                        </Fragment>
                    );
                });
        },
        [bigScreen, rows, selected, toggleExpanded]
        )
    ;

    const [editState, setEditState] = useState<EditState<Transaction>>();

    return <div style={flexContainer}>
        <Helmet><title>Transactions</title></Helmet>

        <div style={flexFullLineItem}>
            <MultiFilter onChanged={setFilter} />
        </div>

        {children.length > 0 && <div style={flexFullLineItem}>
            <Table bordered hover size='sm'>
                <thead>
                <tr>
                    <th>Comments</th>
                    {bigScreen && <>
                        <th>From</th>
                        <th>To</th>
                    </>}
                    <th>Amount</th>
                    <th>Date</th>
                </tr>
                </thead>
                <tbody>
                {children}
                </tbody>
            </Table>
        </div>}

        {getLoadedValue(rows)?.total === 0 && <div style={flexFullLineItem}>
            No transactions found
        </div>}


        <Paginator onChange={setPage}
            currentPage={page}
            totalItemCount={totalItemsCount}
            pageSize={pageSize} />

        {editState?.state === 'delete' &&
        <AsyncConfirm
            body={`Are you sure to delete "${editState.deleting.description}"?`}
            okText='Delete'
            okVariant='danger'
            doConfirm={() => deleteTransaction({id: editState.deleting.id}, authProps)}
            onCancel={() => setEditState(undefined)}
            onConfirmed={() => {
                setEditState(undefined);
                reportTransactionUpdated();
            }}
            confirmInProgressText='Deleting'/>
        }

        {(editState?.state === 'edit' || editState?.state === 'new') &&
        <TransactionEntry
            editing={editState?.state === 'edit' ? editState.editing : undefined}
            onFinish={() => {
                setEditState(undefined);
                reportTransactionUpdated();
            }}
            onClose={() => setEditState(undefined)}/>
        }
    </div>
}

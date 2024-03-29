import { convert, ZoneId } from '@js-joda/core';
import { FoldUpIcon, PencilIcon, TrashIcon } from "@primer/octicons-react";
import { Fragment, useCallback, useContext, useMemo, useState } from "react";
import { Alert, Badge, Button, Table } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { useMediaPredicate } from "react-media-hook";
import { NEVER } from 'rxjs';
import { Sort } from '../api/commonList';
import deleteTransaction from "../api/deleteTransaction";
import { listTransaction } from "../api/listTransaction";
import AsyncConfirm from "../components/AsyncConfirm";
import AttachmentSelect from "../components/AttachmentSelect";
import MultiFilter, { Filter } from "../components/MultiFilter";
import Paginator from "../components/Paginator";
import SortColumn from '../components/SortColumn';
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
    tags?: string[],
};

export default function TransactionListPage({ accounts: initialAccounts, tags: initialTags }: Props) {
    const [page, setPage] = useState<number>();
    const [pageSize, setPageSize] = useState<number>();
    const [sort, setSort] = useState<Sort>();
    const bigScreen = useMediaPredicate('(min-width: 800px)');
    const [filter, setFilter] = useState<Filter>({ accounts: initialAccounts, tags: initialTags });

    const { transactionUpdatedTime, reportTransactionUpdated } = useContext(AppStateContext);
    const authProps = useAuthProps();

    const rows = useObservable(() =>
        (page === undefined || pageSize === undefined) ? NEVER
            : listTransaction({
                offset: pageSize * page,
                limit: pageSize,
                ...filter,
                sorts: sort ? [sort] : undefined,
            }, authProps),
        [page, pageSize, authProps, transactionUpdatedTime, filter, sort]);
    useObservableErrorReport(rows);

    const totalItemsCount = getLoadedValue(rows)?.total ?? 0;
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
                            <td>
                                {r.description}&nbsp;
                                {r.tags.map((t) =>
                                    <Badge bg="primary" key={`badge-${t}`}>{t}</Badge>
                                )}
                            </td>
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

                                        <div style={{ ...flexFullLineItem, ...flexContainer }}>
                                            <AttachmentSelect readonly value={r.attachments} />
                                        </div>
                                        <div style={flexContainer}>
                                            <Button style={flexItem}
                                                onClick={() => setEditState({ state: 'edit', editing: r })}
                                                size='sm'>
                                                <PencilIcon size='small' />&nbsp;EDIT
                                            </Button>
                                            <Button style={flexItem}
                                                onClick={() => setEditState({ state: 'delete', deleting: r })}
                                                size='sm'
                                                variant='danger'>
                                                <TrashIcon size='small' />&nbsp;DELETE
                                            </Button>
                                            <Button style={flexItem} size='sm' variant='secondary'
                                                onClick={() => toggleExpanded(r.id)}>
                                                <FoldUpIcon size='small' />&nbsp;Hide
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
    );

    const [editState, setEditState] = useState<EditState<Transaction>>();

    const loadedValue = getLoadedValue(rows);

    return <div style={flexContainer}>
        <Helmet><title>Transactions</title></Helmet>

        <div style={flexFullLineItem}>
            <MultiFilter onChanged={setFilter}
                initialFilter={filter} />
        </div>


        <div style={flexFullLineItem}>
            <Alert variant='info'>
                <p><b>Number of transactions: </b>{loadedValue ? loadedValue.total : 'N/A'}</p>
                <p><b>Total amount: </b>{loadedValue ? formatAsCurrency(loadedValue.amountTotal) : 'N/A'}</p>
                {loadedValue && loadedValue.total > 0 &&
                    <p><b>Average amount: </b>{formatAsCurrency(loadedValue.amountTotal.divide(loadedValue.total))}</p>
                }

            </Alert>
        </div>


        {children.length > 0 && <div style={flexFullLineItem}>
            <Table bordered hover size='sm'>
                <thead>
                    <tr>
                        <th>Comments</th>
                        {bigScreen && <>
                            <th>
                                <SortColumn label='From'
                                    order={sort?.field === 'fromAccount' ? sort.order : undefined}
                                    onChanged={order => setSort(order ? { field: 'fromAccount', order } : undefined)}
                                />
                            </th>
                            <th>
                                <SortColumn label='To'
                                    order={sort?.field === 'toAccount' ? sort.order : undefined}
                                    onChanged={order => setSort(order ? { field: 'toAccount', order } : undefined)}
                                />
                            </th>
                        </>}
                        <th>
                            <SortColumn label='Amount'
                                order={sort?.field === 'amount' ? sort.order : undefined}
                                onChanged={order => setSort(order ? { field: 'amount', order } : undefined)}
                            />
                        </th>
                        <th>
                            <SortColumn label='Date'
                                order={sort?.field === 'created' ? sort.order : undefined}
                                onChanged={order => setSort(order ? { field: 'created', order } : undefined)}
                            />
                        </th>
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


        <Paginator
            onChange={(page, size) => {
                setPage(page);
                setPageSize(size);
            }}
            totalItemCount={totalItemsCount} />

        {editState?.state === 'delete' &&
            <AsyncConfirm
                body={`Are you sure to delete "${editState.deleting.description}"?`}
                okText='Delete'
                okVariant='danger'
                doConfirm={() => deleteTransaction({ id: editState.deleting.id }, authProps)}
                onCancel={() => setEditState(undefined)}
                onConfirmed={() => {
                    setEditState(undefined);
                    reportTransactionUpdated();
                }}
                confirmInProgressText='Deleting' />
        }

        {(editState?.state === 'edit' || editState?.state === 'new') &&
            <TransactionEntry
                editing={editState?.state === 'edit' ? editState.editing : undefined}
                onFinish={() => {
                    setEditState(undefined);
                    reportTransactionUpdated();
                }}
                onClose={() => setEditState(undefined)} />
        }
    </div>
}

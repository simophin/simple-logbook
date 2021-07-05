import {Button, FormControl, InputGroup, Table} from "react-bootstrap";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import {listTransaction} from "../api/listTransaction";
import {Fragment, useCallback, useContext, useMemo, useState} from "react";
import {useMediaPredicate} from "react-media-hook";
import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import {FoldUpIcon, PencilIcon, SearchIcon, TrashIcon} from "@primer/octicons-react";
import SortedArray from "../utils/SortedArray";
import {Transaction} from "../models/Transaction";
import {EditState} from "../utils/EditState";
import AsyncConfirm from "../components/AsyncConfirm";
import deleteTransaction from "../api/deleteTransaction";
import TransactionEntry from "../components/TransactionEntry";
import {convert, LocalDate, ZoneId} from '@js-joda/core';
import AccountSelect from "../components/AccountSelect";
import {useDebounce} from "../hooks/useDebounce";
import useAuthProps from "../hooks/useAuthProps";
import {AppStateContext} from "../state/AppStateContext";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import {Helmet} from "react-helmet";
import AttachmentItem from "../components/AttachmentItem";
import {formatAsCurrency} from "../utils/numeric";
import Paginator from "../components/Paginator";
import ValueFormControl from "../components/ValueFormControl";

type TransactionId = Transaction['id'];

type Props = {
    accounts?: string[],
};

export default function TransactionListPage({accounts: showAccounts = []}: Props) {
    const [page, setPage] = useState(0);
    const [pageSize] = useState(20);
    const [accounts, setAccounts] = useState<string[]>(showAccounts);
    const [searchTerm, setSearchTerm] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const debouncedSearchTerm = useDebounce(searchTerm, 200);
    const {transactionUpdatedTime, reportTransactionUpdated} = useContext(AppStateContext);
    const authProps = useAuthProps();

    const rows = useObservable(() =>
            listTransaction({
                offset: pageSize * page,
                limit: pageSize,
                accounts: accounts.length > 0 ? accounts : undefined,
                q: debouncedSearchTerm.trim(),
                from: from.length > 0 ? LocalDate.parse(from) : undefined,
                to: to.length > 0 ? LocalDate.parse(to) : undefined,
            }, authProps),
        [page, pageSize, accounts, debouncedSearchTerm,
            authProps, transactionUpdatedTime, from, to]);
    useObservableErrorReport(rows);

    const totalItemsCount = getLoadedValue(rows)?.total ?? 0;
    const numPages = Math.ceil(totalItemsCount / pageSize);

    if (numPages > 0 && page >= numPages) {
        setPage(numPages - 1);
    }

    const [selected, setSelected] = useState(new SortedArray<TransactionId>([]));
    const bigScreen = useMediaPredicate('(min-width: 800px)');

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
                                            {r.attachments.map(r => <AttachmentItem id={r} style={flexItem} />)}
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

        <span style={bigScreen ? {...flexItem, flex: 2} : flexFullLineItem}>
            <InputGroup size='sm'>
                <InputGroup.Prepend>
                    <InputGroup.Text><SearchIcon size={12}/></InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    type='text'
                    placeholder='Search'/>
            </InputGroup>
        </span>


        <span style={bigScreen ? {...flexItem, flex: 3} : flexFullLineItem}>
            <InputGroup size='sm'>
                <InputGroup.Prepend>
                    <InputGroup.Text><PencilIcon size={12}/></InputGroup.Text>
                </InputGroup.Prepend>
                <AccountSelect
                    placeholder='Accounts'
                    selected={accounts}
                    onChange={setAccounts}/>
            </InputGroup>
        </span>

        <div style={{...flexFullLineItem, ...flexContainer, margin: 0, padding: 0}}>
            <InputGroup size='sm' as='span' style={bigScreen ? { ...flexItem, flex: 1 } : flexFullLineItem}>
                <InputGroup.Prepend>
                    <InputGroup.Text>From</InputGroup.Text>
                </InputGroup.Prepend>
                <ValueFormControl
                    value={from}
                    onValueChange={setFrom}
                    type='date'/>
            </InputGroup>

            <InputGroup size='sm' as='span' style={bigScreen ? { ...flexItem, flex: 1 } : flexFullLineItem}>
                <InputGroup.Prepend>
                    <InputGroup.Text>To</InputGroup.Text>
                </InputGroup.Prepend>
                <ValueFormControl
                    value={to}
                    onValueChange={setTo}
                    type='date'/>
            </InputGroup>

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


        <div style={flexContainer}>
            <Paginator onChange={setPage}
                       currentPage={page}
                       totalItemCount={totalItemsCount}
                       pageSize={pageSize} />
        </div>

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
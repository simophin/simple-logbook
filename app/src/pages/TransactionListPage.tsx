import {Button, FormControl, InputGroup, Table} from "react-bootstrap";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import {listTransaction} from "../api/listTransaction";
import {Fragment, useCallback, useContext, useMemo, useState} from "react";
import {useMediaPredicate} from "react-media-hook";
import Pagination from 'react-js-pagination';
import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import {FoldUpIcon, PencilIcon, PlusCircleIcon, SearchIcon, TrashIcon} from "@primer/octicons-react";
import SortedArray from "../utils/SortedArray";
import {Transaction} from "../models/Transaction";
import {EditState} from "../utils/EditState";
import AsyncConfirm from "../components/AsyncConfirm";
import deleteTransaction from "../api/deleteTransaction";
import TransactionEntry from "../components/TransactionEntry";
import {convert, ZoneId} from '@js-joda/core';
import AccountSelect from "../components/AccountSelect";
import {useDebounce} from "../hooks/useDebounce";
import useAuthProps from "../hooks/useAuthProps";
import {AppState} from "../state/AppState";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import {Helmet} from "react-helmet";
import _ from "lodash";

type TransactionId = Transaction['id'];

type Props = {
    accounts?: string[],
    showNewButton?: boolean
};

export default function TransactionListPage({showNewButton, accounts: showAccounts = []}: Props) {
    const [page, setPage] = useState(0);
    const [pageSize] = useState(20);
    const [accounts, setAccounts] = useState<string[]>(showAccounts);
    const [searchTerm, setSearchTerm] = useState('');

    const debouncedSearchTerm = useDebounce(searchTerm, 200);
    const {transactionUpdatedTime, reportTransactionUpdated} = useContext(AppState);
    const authProps = useAuthProps();

    const rows = useObservable(() =>
            listTransaction({
                offset: pageSize * page,
                limit: pageSize,
                accounts: accounts.length > 0 ? accounts : undefined,
                q: debouncedSearchTerm.trim()
            }, authProps),
        [page, pageSize, accounts, debouncedSearchTerm, authProps, transactionUpdatedTime]);
    useObservableErrorReport(rows);

    const totalItemsCount = rows.type === 'loaded' ? rows.data.total : 0;
    const numPages = Math.trunc(totalItemsCount / pageSize);

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
                                <td>{r.amount.format()}</td>
                                <td>{transDate}</td>
                            </tr>
                            {isSelected &&
                            <tr key={`expanded-${r.id}`} className='bg-light'>
                                <td colSpan={bigScreen ? 5 : 3}>
                                    <div style={flexContainer}>
                                        <div style={flexFullLineItem}><strong>From: </strong>{r.fromAccount}</div>
                                        <div style={flexFullLineItem}><strong>To: </strong>{r.toAccount}</div>
                                        <div style={flexFullLineItem}><strong>Amount: </strong>{r.amount.format()}</div>
                                        <div style={flexFullLineItem}><strong>Transaction
                                            date: </strong>{transDate}</div>
                                        <div style={flexFullLineItem}><strong>Last
                                            updated: </strong>{convert(r.updatedDate).toDate().toLocaleString()}</div>
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

        {showNewButton &&
        <Button size='sm'
                onClick={() => setEditState({state: 'new'})}
                style={flexFullLineItem}>
            <PlusCircleIcon size={14}/>&nbsp;New transaction
        </Button>
        }

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


        {children.length > 0 && <div style={flexContainer}>
            <Pagination
                itemClass="page-item"
                linkClass="page-link"
                activePage={page + 1}
                itemsCountPerPage={pageSize}
                totalItemsCount={totalItemsCount}
                pageRangeDisplayed={5}
                onChange={(v) => setPage(v - 1)}
            />
        </div>}

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
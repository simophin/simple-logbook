import {Button, FormControl, InputGroup, Table} from "react-bootstrap";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import {listTransaction} from "../api/listTransaction";
import {useCallback, useContext, useMemo, useState} from "react";
import {useMediaPredicate} from "react-media-hook";
import Pagination from 'react-js-pagination';
import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import {FoldUpIcon, PencilIcon, SearchIcon, TrashIcon} from "@primer/octicons-react";
import SortedArray from "../components/SortedArray";
import {Transaction} from "../models/Transaction";
import {EditState} from "../components/EditState";
import AsyncConfirm from "../components/AsyncConfirm";
import deleteTransaction from "../api/deleteTransaction";
import TransactionEntry from "../components/TransactionEntry";
import {convert, ZoneId} from '@js-joda/core';
import AccountSelect from "../components/AccountSelect";
import {useDebounce} from "../hooks/useDebounce";
import {TransactionStateContext} from "../state/TransactionState";
import {debounceTime, switchMap} from "rxjs/operators";

type TransactionId = Transaction['id'];

export default function TransactionListPage() {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [accounts, setAccounts] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const debouncedSearchTerm = useDebounce(searchTerm, 200);
    const reloadObservable = useContext(TransactionStateContext);

    const rows = useObservable(() =>
            reloadObservable.pipe(
                debounceTime(50),
                switchMap(() => listTransaction({
                    offset: pageSize * page,
                    limit: pageSize,
                    accounts: accounts.length > 0 ? accounts : undefined,
                    q: debouncedSearchTerm.trim()
                }))
            ),
        [page, pageSize, accounts, debouncedSearchTerm]);

    const totalItemsCount = rows.type === 'loaded' ? rows.data.total : 0;
    const numPages = Math.trunc(totalItemsCount / pageSize);

    if (numPages > 0 && page >= numPages) {
        setPage(numPages - 1);
    }

    const [selected, setSelected] = useState(SortedArray.empty<TransactionId>());
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
                        <>
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
                        </>
                    );
                });
        },
        [bigScreen, rows, selected, toggleExpanded]
        )
    ;

    const [editState, setEditState] = useState<EditState<Transaction>>();

    return <div style={flexContainer}>
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
                    persistedKey='txlist-selected-accounts'
                    onChange={setAccounts}/>
            </InputGroup>
        </span>

        <div style={flexFullLineItem}>
            <Table bordered hover>
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
        </div>


        <div style={flexContainer}>
            <Pagination
                itemClass="page-item"
                linkClass="page-link"
                activePage={page + 1}
                itemsCountPerPage={pageSize}
                totalItemsCount={totalItemsCount}
                pageRangeDisplayed={5}
                onChange={(v) => setPage(v - 1)}
            />
        </div>

        {editState?.state === 'delete' &&
        <AsyncConfirm
            body={`Are you sure to delete "${editState.deleting.description}"?`}
            okText='Delete'
            okVariant='danger'
            doConfirm={() => deleteTransaction(editState.deleting.id)}
            onCancel={() => setEditState(undefined)}
            onConfirmed={() => {
                setEditState(undefined);
                reloadObservable.next(undefined);
            }}
            confirmInProgressText='Deleting'/>
        }

        {editState?.state === 'edit' &&
        <TransactionEntry
            editing={editState.editing}
            onFinish={() => {
                setEditState(undefined);
                reloadObservable.next(undefined);
            }}
            onClose={() => setEditState(undefined)}/>
        }
    </div>
}
import {
    CircularProgress,
    Container,
    Fab,
    Fade,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@material-ui/core";
import {useObservable} from "../hooks/useObservable";
import {listTransaction} from "../api/listTransaction";
import currency from 'currency.js';
import React, {CSSProperties, useCallback, useMemo, useState} from "react";
import {getAccountSummaries} from "../api/getAccountSummaries";
import {format} from 'date-fns';
import {useDebounce} from "../hooks/useDebounce";
import {Autocomplete, Pagination} from "@material-ui/lab";
import AddIcon from "@material-ui/icons/Add";
import MenuIcon from "@material-ui/icons/MoreVert";
import {Transaction} from "../models/Transaction";
import TransactionEntry from "../components/TransactionEntry";
import AlertDialog from "../components/AlertDialog";
import deleteTransaction from "../api/deleteTransaction";

const tableHeadStyle: CSSProperties = {
    fontWeight: 'bold'
}

const dateISOFormat = 'yyyy-MM-dd';
const availablePageSizes = [10, 30, 50, 100, 200];

type EditingTransactionState = {
    type: 'editing',
    editing: Transaction,
}

type NewTransactionState = {
    type: 'new',
}

type TransactionDialogState = EditingTransactionState | NewTransactionState | undefined;

export default function Component() {
    const [to, setTo] = useState<Date | undefined>();
    const [from, setFrom] = useState<Date | undefined>();
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(availablePageSizes[0]);
    const [selectedAccount, setSelectedAccount] = useState<string | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
    const searchTermDebounced = useDebounce(searchTerm, 200);
    const [reloadTransaction, setReloadTransaction] = useState(1);
    const rows = useObservable(
        () => listTransaction({
            limit: pageSize,
            offset: currentPage * pageSize,
            from,
            to, q: searchTermDebounced,
            accounts: selectedAccount ? [selectedAccount] : undefined,
        }),
        [pageSize, currentPage, selectedAccount, from, to, searchTermDebounced, reloadTransaction]);
    const numPages = rows.type === 'loaded' && pageSize > 0 ? Math.ceil(rows.data.total / pageSize) : 0;
    const accountBalances = useObservable(() => getAccountSummaries(), [reloadTransaction]);

    const [transactionDialogState, setTransactionDialogState] = useState<TransactionDialogState>();
    const handleDialogClose = useCallback((reload: boolean) => {
        setTransactionDialogState(undefined);
        if (reload) setReloadTransaction(reloadTransaction + 1);
    }, [setTransactionDialogState, setReloadTransaction, reloadTransaction]);

    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number, tx: Transaction } | undefined>();
    const handleContextMenuClose = useCallback(() => {
        setContextMenuPosition(undefined);
    }, [setContextMenuPosition]);

    const [pendingDeletion, setPendingDeletion] = useState<Transaction | undefined>();
    const handleDeleteConfirm = useCallback(async () => {
        try {
            if (pendingDeletion && await deleteTransaction(pendingDeletion.id).toPromise()) {
                setReloadTransaction(reloadTransaction + 1)
            }
        } catch (e) {
            console.error('Error deleting transaction', e);
        }
    }, [pendingDeletion, reloadTransaction, setReloadTransaction]);

    const dataTable = useMemo(() => {
            return <Fade in>
                <Table size="small" style={{width: '100%'}}>
                    <TableHead>
                        <TableCell size="small" style={{...tableHeadStyle, width: '25%'}}>Comment</TableCell>
                        <TableCell size="small" style={{...tableHeadStyle, width: '22%'}}>From</TableCell>
                        <TableCell size="small" style={{...tableHeadStyle, width: '22%'}}>To</TableCell>
                        <TableCell size="small" style={{...tableHeadStyle, width: '16%'}}>Amount</TableCell>
                        <TableCell size="small" style={{...tableHeadStyle, width: '15%'}}>Date</TableCell>
                    </TableHead>

                    {rows.type === 'loaded' && <TableBody>
                        {rows.data.data.map((tx) =>
                            <TableRow>
                                <TableCell size="small">{tx.description}</TableCell>
                                <TableCell size="small">{tx.fromAccount}</TableCell>
                                <TableCell size="small">{tx.toAccount}</TableCell>
                                <TableCell size="small">{currency(tx.amount).divide(100).format()}</TableCell>
                                <TableCell size="small" style={{paddingRight: 0}}>
                                    {new Date(tx.transDate).toLocaleDateString()}
                                    <IconButton size="small" onClick={(e) => {
                                        setContextMenuPosition({x: e.clientX, y: e.clientY, tx});
                                    }}>
                                        <MenuIcon/>
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        )}

                        {rows.data.data.length === 0 &&
                        <Typography variant="body2" style={{padding: 16}}>No records found</Typography>
                        }
                    </TableBody>
                    }

                    {rows.type === 'loading' && <TableBody>
                        <TableRow>
                            <TableCell colSpan={5} align="center">
                                <CircularProgress size={30} />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                    }
                </Table>
            </Fade>;
    }, [rows]);


    return <Container maxWidth="md" style={{display: 'flex', flexWrap: 'wrap'}}>
        <TextField
            style={{flexGrow: 1}}
            variant="outlined"
            InputLabelProps={{shrink: true}}
            value={from ? format(from, dateISOFormat) : ''}
            onChange={(e) =>
                setFrom(e.target.value.length > 0 ? new Date(e.target.value) : undefined)
            }
            type='date'
            label="From"
        />

        <TextField
            style={{marginLeft: 16, flexGrow: 1}}
            variant="outlined"
            InputLabelProps={{shrink: true}}
            value={to ? format(to, dateISOFormat) : ''}
            onChange={(e) =>
                setTo(e.target.value.length > 0 ? new Date(e.target.value) : undefined)
            }
            type='date'
            label="To"
        />

        <Autocomplete
            renderInput={(params) =>
                <TextField variant="outlined" label="Page size" {...params} InputLabelProps={{
                    shrink: true,
                }}/>
            }
            style={{marginLeft: 16}}
            value={pageSize}
            options={availablePageSizes}
            getOptionLabel={(p) => p.toString()}
            onChange={(e, value) =>
                setPageSize(value ?? availablePageSizes[0])}
        />

        <Select
            style={{marginTop: 16, width: '100%'}}
            variant="outlined"
            native
            value={selectedAccount}
            onChange={(e) => {
                setSelectedAccount(e.target.value === '' ? undefined : (e.target.value as string));
            }
            }>
            <option value="">All accounts</option>
            {accountBalances.type === 'loaded' && accountBalances.data.map(({name, balance}) =>
                <option value={name}>{name} ({currency(balance).divide(100).format()})</option>)}
        </Select>

        <TextField
            style={{marginTop: 16, width: '100%'}}
            variant="outlined"
            InputLabelProps={{shrink: true}}
            label="Keyword"
            onChange={(e) => setSearchTerm(e.target.value.trim())}
        />

        <Fab
            color="primary"
            aria-label="add"
            style={{position: 'fixed', bottom: 24, right: 24}}
            onClick={() => setTransactionDialogState({type: 'new'})}>
            <AddIcon/>
        </Fab>

        <Paper style={{
            marginTop: 16,
            marginBottom: 16,
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'end',
            alignItems: 'center'
        }}
               variant="outlined">

            {dataTable}

            {rows.type === 'loaded' && <Typography variant="body2">
                {rows.data.total} record(s)
            </Typography> }

            {numPages > 0 && <Pagination
                style={{padding: 8}}
                size="small"
                count={numPages}
                shape="rounded"
                variant="outlined"
                onChange={(e, p) => setCurrentPage(p - 1)}
                page={currentPage}/>}

        </Paper>

        {transactionDialogState?.type === 'new' &&
        <TransactionEntry onClose={() => handleDialogClose(false)}
                          onSaved={() => setReloadTransaction(reloadTransaction + 1)}/>
        }

        {transactionDialogState?.type === 'editing' &&
        <TransactionEntry
            editing={transactionDialogState.editing}
            onSaved={() => handleDialogClose(true)}
            onClose={() => handleDialogClose(false)}/>
        }

        <Menu
            keepMounted
            open={!!contextMenuPosition}
            anchorReference="anchorPosition"
            anchorPosition={contextMenuPosition ? {top: contextMenuPosition.y, left: contextMenuPosition.x} : undefined}
            onClose={handleContextMenuClose}>
            <MenuItem onClick={() => {
                if (contextMenuPosition) {
                    setTransactionDialogState({type: 'editing', editing: contextMenuPosition.tx});
                }
                handleContextMenuClose();
            }}>Edit</MenuItem>
            <MenuItem onClick={() => {
                if (contextMenuPosition) {
                    setPendingDeletion(contextMenuPosition.tx);
                }
                handleContextMenuClose();
            }}>Remove</MenuItem>
        </Menu>

        {pendingDeletion &&
        <AlertDialog
            title={`Delete "${pendingDeletion.description}"?`}
            positiveButton="Delete"
            negativeButton="No"
            onPositiveClicked={() => {
                handleDeleteConfirm();
                setPendingDeletion(undefined);
            }}
            onNegativeClicked={() => setPendingDeletion(undefined)}
            onClose={() => setPendingDeletion(undefined)}
        />}
    </Container>;
}
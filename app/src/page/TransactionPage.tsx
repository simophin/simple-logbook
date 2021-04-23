import {
    Box,
    CircularProgress,
    Container,
    Fab,
    Fade,
    IconButton,
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
import {Transaction} from "../models/Transaction";
import TransactionEntry from "../components/TransactionEntry";
import EditIcon from '@material-ui/icons/Edit';
import RemoveIcon from '@material-ui/icons/Delete';

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
    const accountBalances = useObservable(() => getAccountSummaries(), []);

    const [transactionDialogState, setTransactionDialogState] = useState<TransactionDialogState>();
    const handleDialogClose = useCallback(() => {
        setTransactionDialogState(undefined);
        setReloadTransaction(reloadTransaction + 1);
    }, [setTransactionDialogState, setReloadTransaction, reloadTransaction]);

    const dataTable = useMemo(() => {
        if (rows.type === 'loaded') {
            return <Fade in>
                <Table size="small" style={{width: '100%'}}>
                    <TableHead>
                        <TableCell style={tableHeadStyle}>Comment</TableCell>
                        <TableCell style={tableHeadStyle}>From</TableCell>
                        <TableCell style={tableHeadStyle}>To</TableCell>
                        <TableCell style={tableHeadStyle}>Amount</TableCell>
                        <TableCell style={tableHeadStyle}>Date</TableCell>
                        <TableCell/>
                    </TableHead>


                    <TableBody>
                        {rows.data.data.map((tx) =>
                            <TableRow>
                                <TableCell>{tx.desc}</TableCell>
                                <TableCell>{tx.fromAccount}</TableCell>
                                <TableCell>{tx.toAccount}</TableCell>
                                <TableCell>{currency(tx.amount).divide(100).format()}</TableCell>
                                <TableCell>{new Date(tx.transDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <IconButton color="primary"
                                                aria-label="edit"
                                                size="small"
                                                onClick={() => setTransactionDialogState({
                                                    type: 'editing',
                                                    editing: tx
                                                })}>
                                        <EditIcon fontSize="small"/>
                                    </IconButton>
                                    <IconButton color="secondary"
                                                aria-label="delete"
                                                size="small"
                                                onClick={() => {}}>
                                        <RemoveIcon fontSize="small"/>
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        )}

                        {rows.data.data.length === 0 &&
                        <Typography variant="body2" style={{padding: 16}}>No records found</Typography>
                        }
                    </TableBody>

                </Table>
            </Fade>;
        } else {
            return <></>
        }
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
            justifyContent: 'end'
        }}
               variant="outlined">

            {rows.type === 'loading' &&
            <Fade in>
                <Box style={{padding: 16}}>
                    <CircularProgress size={40}/>
                </Box>
            </Fade>
            }

            {dataTable}

            {numPages > 0 && <Pagination
                style={{padding: 8, display: 'flex', justifyContent: 'end'}}
                size="small"
                count={numPages}
                shape="rounded"
                variant="outlined"
                onChange={(e, p) => setCurrentPage(p)}
                page={currentPage}/>}

        </Paper>

        {transactionDialogState?.type === 'new' &&
        <TransactionEntry onClose={handleDialogClose}/>
        }

        {transactionDialogState?.type === 'editing' &&
        <TransactionEntry
            editing={transactionDialogState.editing}
            onSaved={handleDialogClose}
            onClose={handleDialogClose}/>
        }
    </Container>;
}
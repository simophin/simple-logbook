import {
    Button,
    Container,
    Dialog,
    DialogTitle,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField
} from "@material-ui/core";
import React, {CSSProperties, useCallback, useRef, useState} from "react";
import {Transaction} from "../models/Transaction";
import {v4 as uuid} from 'uuid';
import {Account} from "../models/Account";
import currency from 'currency.js';
import {format} from 'date-fns';
import {AutoCompleteField, AutoCompleteFieldProps} from "./AutoCompleteField";
import {listTransaction} from "../api/listTransaction";
import {map} from "rxjs/operators";
import _ from 'lodash';
import {of} from "rxjs";
import {createTransaction} from "../api/createTransaction";
import listAccounts from "../api/listAccount";

const DescriptionField = (props: AutoCompleteFieldProps<Transaction>) => AutoCompleteField(props);
const AccountField = (props: AutoCompleteFieldProps<string>) => AutoCompleteField(props);

type Props = {
    editing?: Transaction,
    onClose?: () => unknown,
    onSaved?: () => unknown,
}

const fieldStyle: CSSProperties = {
    marginTop: 16,
    width: '100%',
}

function findTransactionsByDesc(searchTerm: string) {
    searchTerm = searchTerm.trim();
    if (searchTerm.length === 0) {
        return of<Array<Transaction>>([]);
    }

    const filter = {q: searchTerm, limit: 20};
    return listTransaction(filter).pipe(
        map(({data}) => _.uniqBy(data, 'description')),
    );
}

function findAccountsByName(searchTerm: string) {
    searchTerm = searchTerm.trim();
    if (searchTerm.length === 0) {
        return of<Array<string>>([]);
    }

    return listAccounts({q: searchTerm})
        .pipe(map((accounts) => accounts.map(({name}) => name)));
}

async function submitTransaction(tx: Transaction) {
    await createTransaction(tx).toPromise();
    return await listAccounts({includes: [tx.fromAccount, tx.toAccount]}).toPromise();
}

const dateFormat = 'yyyy-MM-dd';

export default function TransactionEntry({editing, onClose, onSaved}: Props) {
    const [id, setId] = useState(editing?.id ?? uuid());
    const [desc, setDesc] = useState(editing?.description ?? '');
    const [fromAccount, setFromAccount] = useState(editing?.fromAccount ?? '');
    const [toAccount, setToAccount] = useState(editing?.toAccount ?? '');
    const [amount, setAmount] = useState(editing ? currency(editing.amount).divide(100).toString() : '');
    const [transDate, setTransDate] = useState(editing ? editing.transDate : format(new Date(), dateFormat));
    const amountRef = useRef<HTMLInputElement | null>(null);
    const descRef = useRef<HTMLInputElement | null>(null);

    const [isSubmitting, setSubmitting] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [accountBalances, setAccountBalances] = useState<Account[]>([]);
    const [dialogOpen, setDialogOpen] = useState(true);

    const handleSubmit = useCallback(async () => {
        setSubmitting(true);

        try {
            setAccountBalances(await submitTransaction({
                id, description: desc, fromAccount, toAccount,
                transDate,
                updatedDate: new Date().toISOString(),
                amount: currency(amount).multiply(100).value,
            }));

            setId(uuid());
            setDesc('');
            setFromAccount('');
            setToAccount('');
            setAmount('');
            descRef.current?.focus();

            if (onSaved) {
                onSaved();
            }
        } catch (e) {
            console.error(e);
            setSnackbarMessage(`Error submitting transaction: ${desc}`);
        } finally {
            setSubmitting(false);
        }
    }, [amount, desc, fromAccount, id, onSaved, toAccount, transDate]);

    const handleDescResultSelected = useCallback((v: Transaction) => {
        setDesc(v.description);
        setFromAccount(v.fromAccount);
        setToAccount(v.toAccount);
        setAmount(currency(v.amount).divide(100).toString());

        amountRef.current?.select();
        amountRef.current?.focus();
    }, []);

    let balanceTable: React.ReactElement | undefined;

    if (accountBalances.length > 0) {
        const balanceRows = accountBalances.map(({name, balance}) =>
            <TableRow>
                <TableCell>{name}</TableCell>
                <TableCell>{currency(balance / 100).format()}</TableCell>
            </TableRow>
        );
        balanceTable = <Paper variant="outlined" style={fieldStyle}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Account</TableCell>
                        <TableCell>Balance</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {balanceRows}
                </TableBody>
            </Table>
        </Paper>;
    }

    return <Dialog open={dialogOpen} disableEscapeKeyDown={true}>
        <Container style={{display: 'flex', flexWrap: 'wrap', paddingBottom: 32}} maxWidth="xs">
            <DialogTitle>
                {editing ? 'Edit transaction' : 'Create transaction'}
            </DialogTitle>
            <DescriptionField label="Description"
                              search={findTransactionsByDesc}
                              value={desc}
                              style={fieldStyle}
                              inputRef={descRef}
                              autoFocus={editing == null}
                              getSearchResultLabel={(v) => v.description}
                              onSearchResultSelected={handleDescResultSelected}
                              onValueChanged={(v) => {
                                  console.log("Value changed to", v);
                                  setDesc(v);
                              }}/>

            <AccountField label="From account"
                          search={findAccountsByName}
                          style={fieldStyle}
                          getSearchResultLabel={(v) => v}
                          value={fromAccount}
                          fullWidth={false}
                          onSearchResultSelected={setFromAccount}
                          onValueChanged={setFromAccount}/>

            <AccountField label="To account"
                          search={findAccountsByName}
                          style={fieldStyle}
                          getSearchResultLabel={(v) => v}
                          value={toAccount}
                          fullWidth={false}
                          onSearchResultSelected={setToAccount}
                          onValueChanged={setToAccount}/>

            <TextField label="Date" fullWidth={true}
                       value={transDate}
                       type="date"
                       style={fieldStyle}
                       variant="outlined"
                       InputLabelProps={{
                           shrink: true,
                       }}
                       onChange={(e) => setTransDate(e.target.value)}
            />

            <TextField label="Amount" fullWidth={true}
                       value={amount}
                       type="number"
                       style={fieldStyle}
                       variant="outlined"
                       inputRef={amountRef}
                       InputLabelProps={{
                           shrink: true,
                       }}
                       onChange={(e) => {
                           setAmount(e.target.value);
                       }}
            />

            <Button color="primary"
                    onClick={handleSubmit}
                    style={fieldStyle}
                    variant="contained"
                    disabled={
                        desc.trim().length === 0 ||
                        fromAccount.trim().length === 0 ||
                        toAccount.trim().length === 0 ||
                        amount.trim().length === 0 ||
                        transDate.trim().length === 0 ||
                        isSubmitting
                    }
            >{isSubmitting ? "Submitting" : "Submit"}</Button>

            <Button color="secondary"
                    variant="outlined"
                    style={fieldStyle}
                    onClick={() => onClose ? onClose() : setDialogOpen(false)}>
                Close
            </Button>

            {balanceTable}

            <Snackbar open={snackbarMessage.length > 0}
                      autoHideDuration={5000}
                      onClose={() => setSnackbarMessage('')}
                      message={snackbarMessage}/>
        </Container>
    </Dialog>
}
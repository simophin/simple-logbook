import {
    Button,
    Snackbar,
    Table, TableBody, TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from "@material-ui/core";
import React, {CSSProperties, useCallback, useRef, useState} from "react";
import {Transaction} from "../models/Transaction";
import {v4 as uuid} from 'uuid';
import {Account} from "../models/Account";
import {findAccountsByName} from "../api/findAccounts";
import {AccountBalance} from "../models/AccountBalance";
import currency from 'currency.js';
import {format} from 'date-fns';
import {AutoCompleteField, AutoCompleteFieldProps} from "./AutoCompleteField";
import {listTransaction} from "../api/listTransaction";
import {map, tap} from "rxjs/operators";
import _ from 'lodash';
import {of} from "rxjs";

const DescriptionField = (props: AutoCompleteFieldProps<Transaction>) => AutoCompleteField(props);
const AccountField = (props: AutoCompleteFieldProps<Account>) => AutoCompleteField(props);

type Props = {
    editing?: Transaction,
    onSubmit: (tx: Transaction) => Promise<AccountBalance[]>,
}

const fieldStyle: CSSProperties = {
    marginTop: 8,
}

function findTransactionsByDesc(searchTerm: string) {
    searchTerm = searchTerm.trim();
    if (searchTerm.length === 0) {
        return of<Array<Transaction>>([]);
    }

    return listTransaction({
        q: searchTerm,
        limit: 20,
    }).pipe(
        tap((v) => console.log('Got item before', v)),
        map(({data}) => _.uniqBy(data, 'desc')),
        tap((v) => console.log('Got item', v))
    );
}

const dateFormat = 'yyyy-MM-dd';

export default function TransactionEntry({editing, onSubmit}: Props) {
    const [id, setId] = useState(editing?.id ?? uuid());
    const [desc, setDesc] = useState(editing?.desc ?? '');
    const [fromAccount, setFromAccount] = useState(editing?.fromAccount ?? '');
    const [toAccount, setToAccount] = useState(editing?.toAccount ?? '');
    const [amount, setAmount] = useState(editing ? currency(editing.amount).divide(100).toString() : '');
    const [transDate, setTransDate] = useState(editing ? editing.transDate : format(new Date(), dateFormat));
    const amountRef = useRef<HTMLInputElement | null>(null);
    const descRef = useRef<HTMLInputElement | null>(null);

    const [isSubmitting, setSubmitting] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);

    const handleSubmit = useCallback(async () => {
        setSubmitting(true);

        try {
            setAccountBalances(await onSubmit({
                id, desc, fromAccount, toAccount,
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
        } catch (e) {
            console.error(e);
            setSnackbarMessage(`Error submitting transaction: ${desc}`);
        } finally {
            setSubmitting(false);
        }
    }, [amount, desc, fromAccount, id, onSubmit, toAccount, transDate]);

    const handleDescResultSelected = useCallback((v: Transaction) => {
        setDesc(v.desc);
        setFromAccount(v.fromAccount);
        setToAccount(v.toAccount);
        setAmount(currency(v.amount).divide(100).toString());

        amountRef.current?.select();
        amountRef.current?.focus();
    }, []);

    let balanceTable: React.ReactElement | undefined;

    if (accountBalances.length > 0) {
        const balanceRows = accountBalances.map(({account, balance}) =>
            <TableRow>
                <TableCell>{account}</TableCell>
                <TableCell>{currency(balance / 100).format()}</TableCell>
            </TableRow>

        );
        balanceTable = <TableContainer style={fieldStyle}>
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
        </TableContainer>;
    }



    return <>
        <DescriptionField label="Description"
                          search={findTransactionsByDesc}
                          value={desc}
                          style={fieldStyle}
                          inputRef={descRef}
                          getSearchResultLabel={(v) => v.desc}
                          onSearchResultSelected={handleDescResultSelected}
                          onValueChanged={setDesc}/>

        <AccountField label="From account"
                      search={findAccountsByName}
                      style={fieldStyle}
                      getSearchResultLabel={(v) => v}
                      value={fromAccount}
                      fullWidth={false}
                      onValueChanged={setFromAccount}/>

        <AccountField label="To account"
                      search={(t) => findAccountsByName(t)}
                      style={fieldStyle}
                      getSearchResultLabel={(v) => v}
                      value={toAccount}
                      fullWidth={false}
                      onValueChanged={setToAccount}/>

        <TextField label="Date" fullWidth={true}
                   value={transDate}
                   type="date"
                   style={fieldStyle}
                   InputLabelProps={{
                       shrink: true,
                   }}
                   onChange={(e) => setTransDate(e.target.value)}
        />

        <TextField label="Amount" fullWidth={true}
                   value={amount}
                   type="number"
                   style={fieldStyle}
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


        {balanceTable}

        <Snackbar open={snackbarMessage.length > 0}
                  autoHideDuration={5000}
                  onClose={() => setSnackbarMessage('')}
                  message={snackbarMessage}/>
    </>
}
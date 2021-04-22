import {Autocomplete} from "@material-ui/lab";
import {Button, Snackbar, TextField} from "@material-ui/core";
import React, {useCallback, useRef, useState} from "react";
import {useDebounce} from "../hooks/useDebounce";
import {useObservable} from "../hooks/useObservable";
import {Observable} from "rxjs";
import {findTransactionsByDesc} from "../api/findTransactions";
import {Transaction, TransactionArrayType} from "../models/Transaction";
import {v4 as uuid} from 'uuid';
import {Account} from "../models/Account";
import {findAccountsByName} from "../api/findAccounts";
import {request} from "../api/common";
import config from "../config";

type AutoCompleteFieldProps<SearchResult> = {
    label: string,

    value?: string,
    onValueChanged: (v: string) => void,

    search: (term: string) => Observable<SearchResult[]>,
    onSearchResultSelected?: (r: SearchResult) => void,

    getSearchResultLabel: (s: SearchResult) => string,

    inputRef?: any,
}

function AutoCompleteField<SearchResult>({
                                             getSearchResultLabel,
                                             label,
                                             onSearchResultSelected,
                                             onValueChanged,
                                             search,
                                             value,
                                             inputRef,
                                         }: AutoCompleteFieldProps<SearchResult>) {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const searchResults = useObservable(() => search(debouncedSearchTerm), [debouncedSearchTerm]);

    return <Autocomplete
        onInputChange={(event, value) => {
            setSearchTerm(value);
            onValueChanged(value);
        }}
        onChange={((event, value) => {
            if (value && typeof value === 'object' && value.type === 'search-result' && onSearchResultSelected) {
                onSearchResultSelected(value.value);
            }
        })}
        loading={searchResults.type === 'loading'}
        onClose={() => setSearchTerm('')}
        inputValue={value}
        freeSolo={true}
        autoComplete={true}
        renderInput={(params) => (
            <TextField {...params} label={label} inputRef={inputRef}/>
        )}
        options={searchResults.type === 'loaded' ? searchResults.data.map((value) => {
            return {
                type: 'search-result',
                value,
            };
        }) : []}
        getOptionLabel={(v) => getSearchResultLabel(v.value)}
        getOptionSelected={(option, value) => option.value === value.value}
    />;
}

const DescriptionField = (props: AutoCompleteFieldProps<Transaction>) => AutoCompleteField(props);
const AccountField = (props: AutoCompleteFieldProps<Account>) => AutoCompleteField(props);

export default function TxEntry() {
    const [id, setId] = useState(uuid());
    const [desc, setDesc] = useState('');
    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [amount, setAmount] = useState('');
    const amountRef = useRef<HTMLInputElement | null>(null);
    const descRef = useRef<HTMLInputElement | null>(null);

    const [isSubmitting, setSubmitting] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const handleSubmit = useCallback(async () => {
        setSubmitting(true);

        try {
            await request({
                url: `${config.baseUrl}/transactions`,
                method: 'post',
                ioType: TransactionArrayType,
                body: [
                    {
                        id, desc, fromAccount, toAccount,
                        amount: Math.trunc(parseFloat(amount) * 100),
                        createdDate: new Date().toISOString(),
                        transDate: new Date().toISOString(),
                    } as Transaction
                ]
            }).toPromise();

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
    }, [amount, desc, fromAccount, id, toAccount]);

    const handleDescResultSelected = useCallback((v: Transaction) => {
        setDesc(v.desc);
        setFromAccount(v.fromAccount);
        setToAccount(v.toAccount);
        setAmount((BigInt(v.amount) / 100n).toString());
        console.log(amountRef.current);

        amountRef.current?.select();
        amountRef.current?.focus();
    }, []);

    return <>
        <DescriptionField label="Description"
                          search={findTransactionsByDesc}
                          value={desc}
                          inputRef={descRef}
                          getSearchResultLabel={(v) => v.desc}
                          onSearchResultSelected={handleDescResultSelected}
                          onValueChanged={setDesc}/>

        <AccountField label="From account"
                      search={findAccountsByName}
                      getSearchResultLabel={(v) => v}
                      value={fromAccount}
                      onValueChanged={setFromAccount}/>

        <AccountField label="To account"
                      search={(t) => findAccountsByName(t)}
                      getSearchResultLabel={(v) => v}
                      value={toAccount}
                      onValueChanged={setToAccount}/>

        <TextField label="Amount" fullWidth={true}
                   value={amount}
                   type="number"
                   inputRef={amountRef}
                   onChange={(e) => setAmount(e.target.value)}
        />

        <Button color="primary"
                onClick={handleSubmit}
                disabled={
                    desc.trim().length === 0 ||
                    fromAccount.trim().length === 0 ||
                    toAccount.trim().length === 0 ||
                    amount.trim().length === 0 ||
                    isSubmitting
                }
        >{isSubmitting ? "Submitting" : "Submit"}</Button>

        <Snackbar open={snackbarMessage.length > 0}
                  autoHideDuration={5000}
                  onClose={() => setSnackbarMessage('')}
                  message={snackbarMessage}/>

    </>;
}
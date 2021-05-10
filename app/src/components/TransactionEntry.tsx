import {Transaction} from "../models/Transaction";
import {Account} from "../models/Account";
import {useCallback, useEffect, useRef, useState} from "react";
import {Button, Col, Form, InputGroup, Modal} from "react-bootstrap";
import AutoCompleteField from "./AutoCompleteField";
import {listTransaction} from "../api/listTransaction";
import {map} from "rxjs/operators";
import _ from "lodash";
import {Either, isLeft} from "fp-ts/Either";
import listAccounts from "../api/listAccount";
import {createTransaction} from "../api/createTransaction";
import {v4 as uuid} from 'uuid';
import currency from 'currency.js';
import AlertDialog from "./AlertDialog";
import {DateTimeFormatter, LocalDate, ZonedDateTime} from "@js-joda/core";
import {NonEmptyString} from "io-ts-types";
import useAuthProps from "../hooks/useAuthProps";
import useAuthErrorReporter from "../hooks/useAuthErrorReporter";

type Props = {
    editing?: Transaction,
    onFinish: () => unknown,
    onClose: () => unknown,
};

const numericRegExp = new RegExp(/^\d*\.?\d{0,2}$/);

export default function TransactionEntry({editing, onFinish, onClose}: Props) {
    const [id, setId] = useState(() => editing?.id ?? uuid());
    const [desc, setDesc] = useState(editing?.description ?? '');
    const [fromAccount, setFromAccount] = useState(editing?.fromAccount ?? '');
    const [toAccount, setToAccount] = useState(editing?.toAccount ?? '');
    const [amount, setAmount] = useState(editing?.amount.toString() ?? '');
    const [date, setDate] = useState((editing?.transDate ?? LocalDate.now()).format(DateTimeFormatter.ISO_LOCAL_DATE));

    const descRef = useRef<HTMLDivElement>(null);
    const amountRef = useRef<HTMLInputElement>(null);

    const isValid = desc.trim().length > 0 &&
        fromAccount.trim().length > 0 &&
        toAccount.trim().length > 0 &&
        amount.length > 0 &&
        date.trim().length > 0;

    const handleDescSearch = useCallback((q: string) => {
        return listTransaction({filter: {q: q.trim(), limit: 30}})
            .pipe(map(({data}) =>
                _.uniqBy(data, 'description')));
    }, []);

    const handleAccountSearch = useCallback((q: string) => {
        return listAccounts({filter: {q}});
    }, []);

    const handleDescChange = useCallback((v: Either<string, Transaction>) => {
        if (isLeft(v)) {
            setDesc(v.left);
        } else {
            setDesc(v.right.description);
            setFromAccount(v.right.fromAccount);
            setToAccount(v.right.toAccount);
            setAmount(v.right.amount.toString());
            setTimeout(() => {
                amountRef.current?.focus();
                amountRef.current?.select();
            }, 100);
        }
    }, []);

    const handleFromAccountChange = useCallback((v: Either<string, Account>) => {
        setFromAccount(isLeft(v) ? v.left : v.right.name);
    }, []);

    const handleToAccountChange = useCallback((v: Either<string, Account>) => {
        setToAccount(isLeft(v) ? v.left : v.right.name);
    }, []);

    const [isSaving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | undefined>();

    const [showingAccountIDs, setShowingAccountIDs] = useState<string[]>([]);
    const [showingAccounts, setShowingAccounts] = useState<Account[]>([]);

    useEffect(() => {
        const sub = listAccounts({filter: {includes: showingAccountIDs}})
            .subscribe((v) => setShowingAccounts(v),
                () => setShowingAccounts([]));
        return () => sub.unsubscribe();
    }, [showingAccountIDs]);

    const authProps = useAuthProps();
    const errorReporter = useAuthErrorReporter();

    const handleSave = () => {
        setSaving(true);

        createTransaction({
            tx: {
                id: id as NonEmptyString,
                fromAccount: fromAccount as NonEmptyString,
                toAccount: toAccount as NonEmptyString,
                transDate: LocalDate.parse(date),
                amount: currency(amount),
                description: desc as NonEmptyString,
                updatedDate: ZonedDateTime.now(),
            },
            ...authProps
        }).subscribe(
            () => {
                setSaving(false);
                onFinish();
                setShowingAccountIDs([fromAccount, toAccount]);

                if (!editing) {
                    setId(uuid());
                    setFromAccount('');
                    setToAccount('');
                    setAmount('');
                    setDesc('');
                    setTimeout(() =>
                            _.get(descRef.current?.getElementsByTagName('input'), 0)?.focus(),
                        100);
                }
            },
            (e: Error) => {
                setSaveError(e?.message ?? 'Unknown error');
                setSaving(false);
                errorReporter(e);
            },
        )
    };

    return <>
        <Modal show onHide={onClose}>
            <Modal.Header>
                {editing ? 'Edit transaction' : 'New transaction'}
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <div ref={descRef}>
                            <AutoCompleteField
                                size='sm'
                                search={handleDescSearch}
                                onChange={handleDescChange}
                                getLabel={({description}) => description}
                                value={desc}/>
                        </div>
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>From</Form.Label>
                        <AutoCompleteField
                            size='sm'
                            search={handleAccountSearch}
                            onChange={handleFromAccountChange}
                            getLabel={({name}) => name}
                            value={fromAccount}/>
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>To</Form.Label>
                        <AutoCompleteField
                            size='sm'
                            search={handleAccountSearch}
                            onChange={handleToAccountChange}
                            getLabel={({name}) => name}
                            value={toAccount}/>
                    </Form.Group>

                    <Form.Row>
                        <Col>
                            <Form.Group>
                                <Form.Label>Amount</Form.Label>
                                <InputGroup size='sm'>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text>$</InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control
                                        ref={amountRef}
                                        value={amount}
                                        onChange={(e) => {
                                            if (numericRegExp.test(e.target.value)) {
                                                setAmount(e.target.value);
                                            }
                                        }}
                                        type='numeric'/>
                                </InputGroup>
                            </Form.Group>
                        </Col>

                        <Col>
                            <Form.Group>
                                <Form.Label>Date</Form.Label>
                                <Form.Control
                                    size='sm'
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value);
                                    }}
                                    type='date'/>
                            </Form.Group>
                        </Col>
                    </Form.Row>

                    {showingAccounts.length > 0 &&
                    <Form.Group>
                        <Form.Label>Account summary</Form.Label>
                        <Form.Text>
                            {showingAccounts.map((v) =>
                                <div><strong>{v.name}: </strong>{v.balance.format()}</div>
                            )}
                        </Form.Text>
                    </Form.Group>
                    }
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant='link'
                        tabIndex={-1}
                        disabled={isSaving}
                        onClick={onClose}>Close</Button>

                <Button disabled={!isValid || isSaving}
                        onClick={handleSave}>{isSaving ? 'Saving' : 'Save'}</Button>
            </Modal.Footer>
        </Modal>

        {
            saveError && <AlertDialog
                cancelText=''
                onOk={() => setSaveError(undefined)}
                onCancel={() => setSaveError(undefined)}
                body={`Error saving transaction: ${saveError}`}/>
        }
    </>
}
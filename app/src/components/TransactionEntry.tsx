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
import AttachmentSelect from "./AttachmentSelect";
import {formatAsCurrency, numericRegExp} from "../utils/numeric";
import useFormField, {checkFormValidity} from "../hooks/useFormField";
import ValueFormControl from "./ValueFormControl";

type Props = {
    editing?: Transaction,
    onFinish: () => unknown,
    onClose: () => unknown,
};

export default function TransactionEntry({editing, onFinish, onClose}: Props) {
    const [id, setId] = useState(() => editing?.id ?? uuid());
    const [desc, setDesc, descError, validateDesc] = useFormField(editing?.description ?? '', {required: true});
    const [fromAccount, setFromAccount, fromAccountError, validateFromAccount] = useFormField(editing?.fromAccount ?? '', {required: true});
    const [toAccount, setToAccount, toAccountError, validateToAccount] = useFormField(editing?.toAccount ?? '', {required: true});
    const [amount, setAmount, amountError, validateAmount] = useFormField(editing?.amount.toString() ?? '', {
        required: true,
        type: 'number'
    });
    const [date, setDate, dateError, validateDate] = useFormField((editing?.transDate ?? LocalDate.now()).format(DateTimeFormatter.ISO_LOCAL_DATE), {required: true});
    const [attachments, setAttachments] = useState<string[]>(editing?.attachments ?? []);

    const descRef = useRef<any>(null);
    const amountRef = useRef<any>(null);

    const authProps = useAuthProps();
    const errorReporter = useAuthErrorReporter();

    const handleDescSearch = useCallback((q: string) => {
        return listTransaction({q: q.trim(), limit: 30}, authProps)
            .pipe(map(({data}) =>
                _.uniqBy(data, 'description')));
    }, [authProps]);

    const handleAccountSearch = useCallback((q: string) => {
        return listAccounts({q}, authProps);
    }, [authProps]);

    const handleDescChange = useCallback((v: Either<string | undefined, Transaction>) => {
        if (isLeft(v)) {
            setDesc(v.left ?? '');
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
    }, [setAmount, setDesc, setFromAccount, setToAccount]);

    const handleFromAccountChange = useCallback((v: Either<string | undefined, Account>) => {
        setFromAccount(isLeft(v) ? (v.left ?? '') : v.right.name);
    }, [setFromAccount]);

    const handleToAccountChange = useCallback((v: Either<string | undefined, Account>) => {
        setToAccount(isLeft(v) ? (v.left ?? '') : v.right.name);
    }, [setToAccount]);

    const [isSaving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | undefined>();

    const [showingAccountIDs, setShowingAccountIDs] = useState<string[]>([]);
    const [showingAccounts, setShowingAccounts] = useState<Account[]>([]);

    useEffect(() => {
        const sub = listAccounts({includes: showingAccountIDs}, authProps)
            .subscribe((v) => setShowingAccounts(v),
                (e) => {
                    setShowingAccounts([]);
                    errorReporter(e);
                });
        return () => sub.unsubscribe();
    }, [authProps, errorReporter, showingAccountIDs]);

    const handleSave = () => {
        if (!checkFormValidity(validateDate, validateAmount, validateDesc,
            validateFromAccount, validateToAccount)) {
            return;
        }

        setSaving(true);

        createTransaction({
            id: id as NonEmptyString,
            fromAccount: fromAccount as NonEmptyString,
            toAccount: toAccount as NonEmptyString,
            transDate: LocalDate.parse(date),
            amount: currency(amount),
            description: desc as NonEmptyString,
            updatedDate: ZonedDateTime.now(),
            attachments: attachments as NonEmptyString[],
        }, authProps).subscribe(
            () => {
                setSaving(false);
                onFinish();
                setShowingAccountIDs([fromAccount, toAccount]);

                if (!editing) {
                    setId(uuid());
                    setFromAccount('', true);
                    setToAccount('', true);
                    setAmount('', true);
                    setDesc('', true);
                    setAttachments([]);
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
                    <Form.Row>
                        <Form.Group as={Col}>
                            <Form.Label>Description</Form.Label>
                            <div ref={descRef}>
                                <AutoCompleteField
                                    size='sm'
                                    data-cy='transaction-entry-description'
                                    isInvalid={!!descError}
                                    search={handleDescSearch}
                                    onChange={handleDescChange}
                                    getLabel={({description}) => description}
                                    value={desc}/>
                            </div>
                            <Form.Text>{descError}</Form.Text>
                        </Form.Group>
                    </Form.Row>

                    <Form.Row>
                        <Form.Group as={Col}>
                            <Form.Label>From</Form.Label>
                            <AutoCompleteField
                                size='sm'
                                search={handleAccountSearch}
                                data-cy='transaction-entry-from'
                                isInvalid={!!fromAccountError}
                                onChange={handleFromAccountChange}
                                getLabel={({name}) => name}
                                value={fromAccount}/>
                            <Form.Text>{fromAccountError}</Form.Text>
                        </Form.Group>

                        <Form.Group as={Col}>
                            <Form.Label>To</Form.Label>
                            <AutoCompleteField
                                size='sm'
                                data-cy='transaction-entry-to'
                                isInvalid={!!toAccountError}
                                search={handleAccountSearch}
                                onChange={handleToAccountChange}
                                getLabel={({name}) => name}
                                value={toAccount}/>
                            <Form.Text>{toAccountError}</Form.Text>
                        </Form.Group>
                    </Form.Row>

                    <Form.Row>
                        <Form.Group as={Col}>
                            <Form.Label>Amount</Form.Label>
                            <InputGroup size='sm'>
                                <InputGroup.Prepend>
                                    <InputGroup.Text>$</InputGroup.Text>
                                </InputGroup.Prepend>
                                <ValueFormControl
                                    data-cy='transaction-entry-amount'
                                    ref={amountRef}
                                    value={amount}
                                    isInvalid={!!amountError}
                                    onValueChange={setAmount}
                                    pattern={numericRegExp}
                                    type='numeric'/>
                            </InputGroup>
                            <Form.Text>{amountError}</Form.Text>
                        </Form.Group>

                        <Form.Group as={Col}>
                            <Form.Label>Date</Form.Label>
                            <ValueFormControl
                                data-cy='transaction-entry-date'
                                size='sm'
                                value={date}
                                onValueChange={setDate}
                                isInvalid={!!dateError}
                                type='date'/>
                            <Form.Text>{dateError}</Form.Text>
                        </Form.Group>
                    </Form.Row>

                    <Form.Row>
                        <Form.Group as={Col}>
                            <Form.Label>Attachments</Form.Label>
                            <AttachmentSelect value={attachments} onChange={setAttachments}/>
                        </Form.Group>
                    </Form.Row>

                    {showingAccounts.length > 0 &&
                    <Form.Group as={Col}>
                        <Form.Label>Account summary</Form.Label>
                        <Form.Text>
                            {showingAccounts.map((v) =>
                                <div
                                    key={v.name}
                                    data-cy={`transaction-account-${v.name}`}><strong>{v.name}: </strong><span data-cy='amount'>{formatAsCurrency(v.balance)}</span></div>
                            )}
                        </Form.Text>
                    </Form.Group>
                    }
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant='link'
                        tabIndex={-1}
                        data-cy='transaction-entry-close'
                        disabled={isSaving}
                        onClick={onClose}>Close</Button>

                <Button onClick={handleSave}
                        data-cy='transaction-entry-save'>{isSaving ? 'Saving' : 'Save'}</Button>
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
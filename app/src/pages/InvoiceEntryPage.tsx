import {Badge, Button, Col, Dropdown, Form, FormControl} from "react-bootstrap";
import {flexContainer, flexFullLineItem} from "../styles/common";
import {Helmet} from "react-helmet";
import useFormField, {checkFormValidity} from "../hooks/useFormField";
import ValueFormControl from "../components/ValueFormControl";
import DropdownItem from "react-bootstrap/DropdownItem";
import DropdownToggle from "react-bootstrap/DropdownToggle";
import DropdownMenu from "react-bootstrap/DropdownMenu";
import React, {forwardRef, useCallback, useEffect, useMemo, useState} from "react";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import useAuthProps from "../hooks/useAuthProps";
import {Invoice, listInvoice, saveInvoice} from "../api/invoices";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import InvoiceItemSelect from "../components/InvoiceItemSelect";
import InvoiceExtraChargeSelect from "../components/InvoiceExtraChargeSelect";
import {formatAsStandardLocalDate} from "../utils/dates";
import {LocalDate, ZonedDateTime, ZoneId} from "@js-joda/core";
import currency from "currency.js";
import {formatAsCurrency} from "../utils/numeric";
import AttachmentSelect from "../components/AttachmentSelect";
import {NonEmptyString} from "io-ts-types";
import useAuthErrorReporter from "../hooks/useAuthErrorReporter";
import {useHistory, useLocation, useParams} from 'react-router-dom';
import LoadPage from "../components/LoadPage";
import {map} from "rxjs/operators";
import InvoiceExtraInfoSelect from "../components/InvoiceExtraInfoSelect";
import {v4 as uuid} from 'uuid';
import AlertDialog from "../components/AlertDialog";

type Props = {
    editing?: Invoice,
};

const CopyFromToggle = forwardRef<any, { onClick: (e: any) => unknown }>(({children, onClick}, ref) => (
    <Badge
        ref={ref}
        variant='primary'
        role='button'
        onClick={onClick}>
        {children}
    </Badge>
));

const CopyFromContainer = forwardRef(({children}) => (<div style={{display: 'inline'}}>{children}</div>));



export default function InvoiceEntryPage({editing}: Props) {
    const authProps = useAuthProps();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const copyFromInvoiceId = !editing && searchParams.get('copyFrom');

    const [id] = useState(() => editing?.id ?? uuid());
    const [client, setClient, clientError, checkClient] = useFormField(editing?.client ?? '', {required: true});
    const [clientDetails, setClientDetails, clientDetailsError, checkClientDetails] = useFormField(editing?.clientDetails ?? '');
    const [companyName, setCompanyName, companyNameError, checkCompanyName] = useFormField(editing?.companyName ?? '');
    const [items, setItems] = useState<Invoice['items']>(editing?.items ?? []);
    const [extraCharges, setExtraCharges] = useState<Invoice['extraCharges']>(editing?.extraCharges ?? []);
    const [invoiceDate, setInvoiceDate, invoiceDateError, checkInvoiceDate] = useFormField(formatAsStandardLocalDate(editing?.date ?? ZonedDateTime.now()), {required: true});
    const [dueDate, setDueDate, dueDateError, checkDueDate] = useFormField(editing?.dueDate ? formatAsStandardLocalDate(editing.dueDate) : '', {required: true});
    const [attachments, setAttachments] = useState<string[]>(editing?.attachments ?? []);
    const [totalSelectedAmount, setTotalSelectedAmount] = useState(currency(0));
    const [notes, setNotes, notesError, checkNotes] = useFormField(editing?.notes ?? '', {required: false});
    const [extraInfo, setExtraInfo] = useState<Invoice['extraInfo']>(editing?.extraInfo ?? []);
    const [paymentInfo, setPaymentInfo, paymentInfoError, checkPaymentInfo] = useFormField(editing?.paymentInfo ?? '', {required: false});

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>();

    const errorReporter = useAuthErrorReporter();

    const history = useHistory();

    const handleSave = () => {
        if (!checkFormValidity(checkClient, checkClientDetails, checkCompanyName,
            checkInvoiceDate, checkDueDate, checkNotes, checkPaymentInfo)) {
            return;
        }

        setSaving(true);
        saveInvoice({
            id: id as NonEmptyString,
            notes, items, attachments: attachments as NonEmptyString[],
            companyName, client, clientDetails,
            date: LocalDate.parse(invoiceDate).atStartOfDay().atZone(ZoneId.systemDefault()),
            dueDate: LocalDate.parse(invoiceDate).atStartOfDay().atZone(ZoneId.systemDefault()),
            extraCharges,
            extraInfo,
            paymentInfo,
            amount: currency(0), // readonly field
            reference: 0, // readonly field
        }, authProps).subscribe(() => {
            setSaving(false);
            history.push(`/invoice/view/${id}`);
        }, (e) => {
            setSaving(false);
            errorReporter(e);
            setError(e?.message ?? 'Unknown error');
        })
    };

    const totalDueAmount = useMemo(() => {
        let total = totalSelectedAmount;
        for (const charge of extraCharges) {
            switch (charge.type) {
                case "percent":
                    total = total.add(total.multiply(charge.amount).divide(100));
                    break;
                case "absolute":
                    total = total.add(charge.amount);
                    break;
            }
        }
        return formatAsCurrency(total);
    }, [totalSelectedAmount, extraCharges]);

    const recentInvoices = useObservable(() => listInvoice({limit: 10}, authProps), [authProps]);
    useObservableErrorReport(recentInvoices);

    const fillForm = useCallback((v: Invoice) => {
        setClient(v.client ?? '');
        setClientDetails(v.clientDetails ?? '');
        setCompanyName(v.companyName ?? '');
        setExtraCharges(v.extraCharges);
        setExtraInfo(v.extraInfo);
        setPaymentInfo(v.paymentInfo);
    }, [setClient, setClientDetails, setCompanyName, setPaymentInfo]);

    useEffect(() => {
        if (copyFromInvoiceId) {
            const sub = listInvoice({includes: [copyFromInvoiceId]})
                .subscribe(({data}) => {
                    if (data.length > 0) {
                        fillForm(data[0]);
                    }
                });
            return () => sub.unsubscribe();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const recentInvoicesData = getLoadedValue(recentInvoices)?.data;
    const copyFrom = useMemo(() => !editing && recentInvoicesData && recentInvoicesData.length > 0 &&
        <Dropdown as={CopyFromContainer}>
            <DropdownToggle as={CopyFromToggle}>Copy from...</DropdownToggle>
            <DropdownMenu>
                {recentInvoicesData.map((invoice) =>
                    <DropdownItem key={invoice.id} onSelect={() => fillForm(invoice)}>
                        {invoice.client ?? 'Unknown client'},&nbsp;
                        {new Date(invoice.date.toInstant().toEpochMilli()).toLocaleDateString()},&nbsp;
                        {formatAsCurrency(invoice.amount)}
                    </DropdownItem>)
                }
            </DropdownMenu>
        </Dropdown>, [editing, fillForm, recentInvoicesData]);


    return <div style={flexContainer}>
        <Helmet><title>Invoice</title></Helmet>
        <Form style={flexFullLineItem}>
            <Form.Row>
                <Col>
                    <h4 style={{
                        display: 'inline',
                        marginRight: 8
                    }}>{editing ? 'Edit invoice' : 'New invoice'}</h4>{copyFrom}
                </Col>
            </Form.Row>

            {editing && <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Invoice number</Form.Label>
                    <FormControl value={editing.reference.toString()} readOnly/>
                </Form.Group>
            </Form.Row>}


            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Invoice date</Form.Label>
                    <ValueFormControl
                        type='date'
                        value={invoiceDate}
                        onValueChange={setInvoiceDate}
                        isInvalid={!!invoiceDateError}/>
                    {invoiceDateError && <Form.Text>{invoiceDateError}</Form.Text>}
                </Form.Group>
            </Form.Row>

            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Client name</Form.Label>
                    <ValueFormControl
                        value={client}
                        onValueChange={setClient}
                        isInvalid={!!clientError}/>
                    {clientError && <Form.Text>{clientError}</Form.Text>}
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Client details</Form.Label>
                    <ValueFormControl
                        as='textarea'
                        value={clientDetails}
                        rows={5}
                        onValueChange={setClientDetails}
                        isInvalid={!!clientDetailsError}/>
                    {clientDetailsError && <Form.Text>{clientDetailsError}</Form.Text>}
                </Form.Group>
            </Form.Row>

            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Company name</Form.Label>
                    <ValueFormControl
                        value={companyName}
                        onValueChange={setCompanyName}
                        isInvalid={!!companyNameError}/>
                    {companyNameError && <Form.Text>{companyNameError}</Form.Text>}
                </Form.Group>
            </Form.Row>

            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Additional info</Form.Label>
                    <InvoiceExtraInfoSelect value={extraInfo} onChange={setExtraInfo}/>
                </Form.Group>
            </Form.Row>

            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Items</Form.Label>
                    <InvoiceItemSelect selected={items} onChange={setItems}
                                       invoiceId={editing?.id}
                                       onSelectedAmountChanged={setTotalSelectedAmount}/>
                    <Form.Text>{Error}</Form.Text>
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Extra charges</Form.Label>
                    <Form.Text>These charges will add/apply to the sum in according to their order</Form.Text><br/>
                    <InvoiceExtraChargeSelect value={extraCharges} onChange={setExtraCharges}/>
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Due amount</Form.Label>
                    <ValueFormControl
                        readOnly
                        value={totalDueAmount}/>
                </Form.Group>
                <Form.Group as={Col}>
                    <Form.Label>Due date</Form.Label>
                    <ValueFormControl
                        type='date'
                        value={dueDate}
                        onValueChange={setDueDate}
                        isInvalid={!!dueDateError}/>
                    {dueDateError && <Form.Text>{dueDateError}</Form.Text>}
                </Form.Group>
            </Form.Row>

            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Payment instruction</Form.Label>
                    <ValueFormControl
                        as='textarea'
                        rows={5}
                        value={paymentInfo}
                        onValueChange={setPaymentInfo}
                        isInvalid={!!paymentInfoError}/>
                    <Form.Text>{paymentInfoError}</Form.Text>
                </Form.Group>
            </Form.Row>

            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Notes</Form.Label>
                    <ValueFormControl
                        as='textarea'
                        rows={5}
                        value={notes}
                        onValueChange={setNotes}
                        isInvalid={!!notesError}/>
                    {notesError && <Form.Text>{notesError}</Form.Text>}
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Attachments</Form.Label>
                    <AttachmentSelect value={attachments} onChange={setAttachments}/>
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Col>
                    <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving' : 'Save'}</Button>
                </Col>
            </Form.Row>
        </Form>

        {error && <AlertDialog body={`Error: ${error}`}
                               cancelText=''
                               onOk={() => setError(undefined)}
        />}
    </div>;
}

export function InvoiceEditPage()
{
    const params = useParams<{ id: string }>();
    const authProps = useAuthProps();
    const load = useCallback(({id, ...props}: typeof params & typeof authProps) => {
        return listInvoice({includes: [id]}, props)
            .pipe(map(invoices => {
                if (invoices.data.length === 0) {
                    throw new Error(`Invoice with ID ${id} not found`);
                }
                return {editing: invoices.data[0]};
            }))
    }, []);

    return <LoadPage
        loadingProps={{...params, ...authProps}}
        loader={load}
        element={(props) => <InvoiceEntryPage {...props} />}/>
}
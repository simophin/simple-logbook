import {Button, ButtonGroup, Col, Form, Modal} from "react-bootstrap";
import {InvoiceItem, listInvoiceItems, saveInvoiceItem, searchItemCategories} from "../api/invoiceItems";
import {FormEvent, useCallback, useContext, useMemo, useState} from "react";
import AlertDialog from "./AlertDialog";
import ValueFormControl from "./ValueFormControl";
import AutoCompleteField from "./AutoCompleteField";
import {map} from "rxjs/operators";
import _ from "lodash";
import {Either, isLeft} from "fp-ts/Either";
import {formatAsCurrency, numericRegExp, signedNumericRegExp, toCurrencyOrZero} from "../utils/numeric";
import currency from 'currency.js';
import useAuthProps from "../hooks/useAuthProps";
import {Duration, LocalDate, ZonedDateTime, ZoneId} from "@js-joda/core";
import {createEnumType} from "../utils/codecs";
import {usePersistedState} from "../hooks/usePersistedState";
import useFormField, {checkFormValidity} from "../hooks/useFormField";
import {v4 as uuid} from 'uuid';
import {NonEmptyString} from "io-ts-types";
import AttachmentSelect from "./AttachmentSelect";
import {AppStateContext} from "../state/AppStateContext";


type EditingState = {
    state: 'edit',
} & InvoiceItem;

type NewState = {
    state: 'new',
    category?: string,
};

type TimerState = {
    state: 'timer',
    description: string,
    date: ZonedDateTime,
    category?: string,
    subCategory?: string,
    unitPrice?: currency,
}

type DraftState = EditingState | NewState | TimerState;

type Props = {
    draft: DraftState,
    onSubmitted?: () => unknown,
    onHide: () => unknown,
    listInvoiceItemsFn?: typeof listInvoiceItems,
    searchCatFn?: typeof searchItemCategories,
    saveFn?: typeof saveInvoiceItem,
    now?: ZonedDateTime,
};

const allRoundingModes = ['1m', '15m', '30m', '1h'] as const;
type RoundingMode = typeof allRoundingModes[number];
const roundingModeType = createEnumType(allRoundingModes);

function computeUnit(state: TimerState, now: ZonedDateTime, roundingMode: RoundingMode): string {
    const duration = Duration.between(state.date, now);
    const hours100 = Math.trunc(duration.seconds() * 100 / 3600);
    let increment: number;
    switch (roundingMode) {
        case "1m":
            return currency(hours100).divide(100).toString();
        case "15m":
            increment = 25;
            break;
        case "30m":
            increment = 50;
            break;
        case "1h":
            increment = 100;
            break;
    }

    return currency(Math.ceil(hours100 / increment)).multiply(increment).divide(100).toString();
}

export default function InvoiceItemEntry({
                                             draft, onHide,
                                             listInvoiceItemsFn = listInvoiceItems,
                                             searchCatFn = searchItemCategories,
                                             onSubmitted,
                                             now = ZonedDateTime.now(),
                                             saveFn = saveInvoiceItem,
                                         }: Props) {
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const [id, setId] = useState(() => _.get(draft, 'id') ?? uuid());
    const [date, setDate, dateError, validateDate] = useFormField(() => {
        if ('date' in draft) {
            return draft.date.toLocalDate().toJSON();
        }
        return LocalDate.now().toJSON();
    });
    const [category, setCategory, categoryError, validateCategory] = useFormField(_.get(draft, 'category') ?? '', {required: true});
    const [subCategory, setSubCategory, subCategoryError, validateSubCategory] = useFormField(_.get(draft, 'subCategory') ?? '');
    const [desc, setDesc, descError, validateDesc] = useFormField(_.get(draft, 'description') ?? '', {required: true});
    const [attachments, setAttachments] = useState<string[]>('attachments' in draft ? draft.attachments : []);
    const [notes, setNotes, notesError, checkNotes] = useFormField(_.get(draft, 'notes') ?? '');

    const [roundingMode, setRoundingMode] = usePersistedState('item-entry-rounding-mode', roundingModeType, allRoundingModes[0]);
    const [unit, setUnit, unitError, validateUnit] = useFormField(() => {
        switch (draft.state) {
            case 'timer':
                return computeUnit(draft, now, roundingMode);
            case 'edit':
                return draft.unit.toString();
            default:
                return '';
        }
    }, {
        type: 'number', required: true, min: 0
    });
    const [unitPrice, setUnitPrice, unitPriceError, validateUnitPrice] = useFormField(_.get(draft, 'unitPrice')?.toString() ?? '', {
        type: 'number', required: true
    });
    const totalPrice = useMemo(() => {
        if (unit.length === 0 || unitPrice.length === 0) {
            return formatAsCurrency(0);
        }
        return formatAsCurrency(toCurrencyOrZero(unit).multiply(toCurrencyOrZero(unitPrice)));
    }, [unit, unitPrice]);

    const authProps = useAuthProps();

    const searchByDesc = useCallback((term: string) => {
        return listInvoiceItemsFn({q: term, limit: 20}, authProps)
            .pipe(map(
                (data) => _.uniqBy(data, 'description')
            ));
    }, [listInvoiceItemsFn, authProps]);

    const searchCategory = useCallback((term: string) => {
        return searchCatFn({q: term}, authProps);
    }, [searchCatFn, authProps]);

    const searchSubCategory = useCallback((term: string) => {
        return searchCatFn({q: term, searchSubCategory: true}, authProps);
    }, [searchCatFn, authProps]);

    const {reportTransactionUpdated} = useContext(AppStateContext);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!checkFormValidity(validateDesc, validateDate, checkNotes,
            validateCategory, validateSubCategory,
            validateUnit, validateUnitPrice)) {
            return;
        }

        setSaving(true);

        saveFn({
            id: id as NonEmptyString,
            category: category as NonEmptyString,
            subCategory: subCategory,
            description: desc,
            invoiceId: _.get(draft, 'invoiceId'),
            unit: currency(unit),
            unitPrice: currency(unitPrice),
            notes,
            date: 'date' in draft ? draft.date : LocalDate.parse(date).atStartOfDay().atZone(ZoneId.systemDefault()),
            attachments: attachments as NonEmptyString[],
        }, authProps).subscribe(() => {
            setSaving(false);
            if (onSubmitted) {
                onSubmitted();
            }
            reportTransactionUpdated();
            if (draft.state === 'new') {
                setId(uuid());
                setDesc('', true);
                setCategory('', true);
                setSubCategory('', true);
                setUnit('', true);
                setUnitPrice('', true);
                setNotes('', true);
                setAttachments([]);
            } else {
                onHide();
            }
        }, (e) => {
            setSaving(false);
            setError(e?.message ?? 'Unknown error');
        });
    };

    const handleDelete = () => {
    };

    const handleDescriptionChanged = (v: Either<string | undefined, InvoiceItem>) => {
        if (isLeft(v)) {
            setDesc(v.left ?? '');
        } else {
            setCategory(v.right.category ?? '');
            setSubCategory(v.right.subCategory ?? '');
            setDesc(v.right.description ?? '');
            setUnit(v.right.unit.toString());
            setUnitPrice(v.right.unitPrice.toString());
        }
    };

    return <Modal show>
        <Form onSubmit={handleSubmit} noValidate>
            <Modal.Header>
                {draft.state === 'edit' && 'Edit invoice item'}
                {draft.state === 'new' && 'New invoice item'}
                {draft.state === 'timer' && 'Save timed task'}
            </Modal.Header>
            <Modal.Body>
                <Form.Row>
                    {draft.state === 'timer' && <Form.Group as={Col}>
                        <Form.Label>Started time</Form.Label>
                        <Form.Control readOnly
                                      value={new Date(draft.date.toInstant().toEpochMilli()).toLocaleString()}/>
                    </Form.Group>}

                    {draft.state !== 'timer' && <Form.Group as={Col}>
                        <Form.Label>Date</Form.Label>
                        <ValueFormControl
                            value={date}
                            onValueChange={setDate}
                            isInvalid={!!dateError}
                            type='date'/>
                        <Form.Text>{dateError}</Form.Text>
                    </Form.Group>}

                </Form.Row>

                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>Description</Form.Label>
                        <AutoCompleteField
                            search={searchByDesc}
                            isInvalid={!!descError}
                            onChange={handleDescriptionChanged}
                            getLabel={v => v.description ?? ''}
                            value={desc}/>
                        <Form.Text>{descError}</Form.Text>
                    </Form.Group>
                </Form.Row>

                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>Category</Form.Label>
                        <AutoCompleteField
                            search={searchCategory}
                            isInvalid={!!categoryError}
                            onChange={(v) => {
                                if (isLeft(v)) {
                                    setCategory(v.left ?? '');
                                } else {
                                    setCategory(v.right as string);
                                }
                            }}
                            getLabel={v => v as string}
                            value={category}/>
                        <Form.Text>{categoryError}</Form.Text>
                    </Form.Group>

                    <Form.Group as={Col}>
                        <Form.Label>Subcategory</Form.Label>
                        <AutoCompleteField
                            search={searchSubCategory}
                            isInvalid={!!subCategoryError}
                            onChange={(v) => {
                                if (isLeft(v)) {
                                    setSubCategory(v.left ?? '');
                                } else {
                                    setSubCategory(v.right as string);
                                }
                            }}
                            getLabel={v => v as string}
                            value={subCategory}/>
                        <Form.Text>{subCategoryError}</Form.Text>
                    </Form.Group>
                </Form.Row>

                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>Unit</Form.Label>
                        <ValueFormControl
                            value={unit}
                            isInvalid={!!unitError}
                            pattern={numericRegExp}
                            onValueChange={setUnit}/>
                        <Form.Text>{unitError}</Form.Text>
                    </Form.Group>

                    {draft.state === 'timer' && <Form.Group as={Col}>
                        <Form.Label>Rounding</Form.Label>
                        <ButtonGroup>
                            {allRoundingModes.map(mode =>
                                <Button key={mode}
                                        variant={roundingMode === mode ? 'primary' : 'outline-primary'}
                                        onClick={() => {
                                            setRoundingMode(mode);
                                            setUnit(computeUnit(draft, now, mode).toString());
                                        }}
                                >{mode}</Button>)}
                        </ButtonGroup>
                    </Form.Group>}
                </Form.Row>

                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>Unit price</Form.Label>
                        <ValueFormControl
                            value={unitPrice}
                            isInvalid={!!unitPriceError}
                            pattern={signedNumericRegExp}
                            onValueChange={setUnitPrice}/>
                        <Form.Text>{unitPriceError}</Form.Text>
                    </Form.Group>

                    <Form.Group as={Col}>
                        <Form.Label>Total price</Form.Label>
                        <Form.Control
                            readOnly
                            value={totalPrice}/>
                    </Form.Group>
                </Form.Row>

                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>Notes</Form.Label>
                        <ValueFormControl
                            as='textarea'
                            value={notes}
                            onValueChange={setNotes}
                            isInvalid={!!notesError} />
                        <Form.Text>{notesError}</Form.Text>
                    </Form.Group>
                </Form.Row>

                <Form.Row>
                    <Form.Group as={Col}>
                        <Form.Label>Attachments</Form.Label>
                        <AttachmentSelect value={attachments} onChange={setAttachments}/>
                    </Form.Group>
                </Form.Row>

            </Modal.Body>
            <Modal.Footer>
                <Button variant='outline-primary' onClick={onHide}>Close</Button>
                {draft.state !== 'new' && <Button
                    variant='outline-danger'
                    onClick={() => setConfirmingDelete(true)}>Delete</Button>}
                <Button variant='primary'
                        disabled={isSaving}
                        type='submit'>
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </Modal.Footer>
        </Form>

        {confirmingDelete &&
        <AlertDialog body='Are you sure to delete this item?'
                     onCancel={() => setConfirmingDelete(false)}
                     onOk={() => {
                         setConfirmingDelete(false);
                         handleDelete();
                         onHide();
                     }}
        />}

        {error && <AlertDialog body={`Error: ${error}`}
                               cancelText=''
                               onOk={() => setError(undefined)}
        />}
    </Modal>
}
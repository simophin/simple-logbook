import {Button, Col, Form, Modal, Row} from "react-bootstrap";
import {useCallback} from "react";
import useAuthProps from "../hooks/useAuthProps";
import {map} from "rxjs/operators";
import * as t from "io-ts";
import * as codec from "io-ts-types";
import {NonEmptyString} from "io-ts-types";
import {currencyType, zonedDateTimeType} from "../api/codecs";
import {Duration, ZonedDateTime} from "@js-joda/core";
import {InvoiceItem, listInvoiceItems, searchItemCategories} from "../api/invoiceItems";
import useFormField, {checkFormValidity} from "../hooks/useFormField";
import _ from "lodash";
import ValueFormControl from "./ValueFormControl";
import AutoCompleteField from "./AutoCompleteField";
import {isLeft} from "fp-ts/Either";
import {signedNumericRegExp} from "../utils/numeric";
import currency from 'currency.js';

export const timedTaskStateType = t.intersection([
    t.type({
        description: codec.NonEmptyString,
        date: zonedDateTimeType,
    }),
    t.partial({
        category: t.string,
        subCategory: t.string,
        unitPrice: currencyType,
    }),
]);

export type TimedTaskState = t.TypeOf<typeof timedTaskStateType>;

export function computeDuration(state: TimedTaskState) {
    const duration = Duration.between(state.date, ZonedDateTime.now());
    const minutes = duration.toMinutes();
    let hours = 0;
    if (minutes > 60) {
        hours = Math.trunc(minutes / 60);
        return `${hours}h${minutes % 60}m`
    } else {
        return `${minutes}m`;
    }
}

type Props = {
    now?: ZonedDateTime,
    onStarted: (s: TimedTaskState) => unknown,
    onHide: () => unknown,
    searchByDescription?: typeof listInvoiceItems,
    searchCategory?: typeof searchItemCategories,
};

export default function TimedTaskEntry({
                                           onHide, onStarted,
                                           now = ZonedDateTime.now(),
                                           searchByDescription: searchByDescFn = listInvoiceItems,
                                           searchCategory: searchCategoryFn = searchItemCategories,
                                       }: Props) {
    const authProps = useAuthProps();

    const [desc, setDesc, descError, checkDesc] = useFormField('', {required: true});
    const [category, setCategory, catError, checkCat] = useFormField('', {required: false});
    const [subCategory, setSubCategory, subCatError, checkSubCat] = useFormField('', {required: false});
    const [unitPrice, setUnitPrice, unitPriceError, checkUnitPrice] = useFormField('', {required: false});

    const searchByDesc = useCallback((term: string) => {
        return searchByDescFn({q: term, limit: 20}, authProps)
            .pipe(map((data) => _.uniqBy(data, 'description')));
    }, [searchByDescFn, authProps]);

    const searchCategory = useCallback((term: string) => {
        return searchCategoryFn({q: term}, authProps);
    }, [searchCategoryFn, authProps]);

    const searchSubCategory = useCallback((term: string) => {
        return searchCategoryFn({q: term, searchSubCategory: true}, authProps);
    }, [searchCategoryFn, authProps]);

    const fillForm = (v: InvoiceItem) => {
        setCategory(v.category);
        setSubCategory(v.subCategory ?? '');
        setUnitPrice(v.unitPrice.toString());
        setDesc(v.description ?? '');
    };

    const handleStart = () => {
        if (!checkFormValidity(checkDesc, checkCat, checkSubCat, checkUnitPrice)) {
            return;
        }

        onStarted({
            description: desc as NonEmptyString,
            date: now,
            subCategory: subCategory,
            category: category,
            unitPrice: unitPrice.length > 0 ? currency(unitPrice) : undefined,
        });
        onHide();
    };

    return <Modal show onHide={onHide}>
        <Modal.Header>Start time tracker</Modal.Header>
        <Modal.Body>
            <Form>
                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>Description</Form.Label>
                        <AutoCompleteField search={searchByDesc}
                                           placeholder='Description'
                                           onChange={(v) => {
                                               if (isLeft(v)) {
                                                   setDesc(v.left);
                                               } else {
                                                   fillForm(v.right);
                                               }
                                           }}
                                           isInvalid={!!descError}
                                           getLabel={v => v.description ?? ''}
                                           value={desc} />
                        <Form.Text>{descError}</Form.Text>
                    </Form.Group>
                </Row>

                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>Category</Form.Label>
                        <AutoCompleteField search={searchCategory}
                                           placeholder='Category'
                                           onChange={(v) => {
                                               if (isLeft(v)) {
                                                   setCategory(v.left);
                                               } else {
                                                   setCategory(v.right);
                                               }
                                           }}
                                           isInvalid={!!catError}
                                           getLabel={v => v}
                                           value={category} />
                        <Form.Text>{catError}</Form.Text>
                    </Form.Group>

                    <Form.Group as={Col}>
                        <Form.Label>Sub-category</Form.Label>
                        <AutoCompleteField search={searchSubCategory}
                                           placeholder='Sub-category'
                                           onChange={(v) => {
                                               if (isLeft(v)) {
                                                   setSubCategory(v.left);
                                               } else {
                                                   setSubCategory(v.right);
                                               }
                                           }}
                                           isInvalid={!!subCatError}
                                           getLabel={v => v}
                                           value={subCategory} />
                        <Form.Text>{subCatError}</Form.Text>
                    </Form.Group>
                </Row>

                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>Unit price</Form.Label>
                        <ValueFormControl
                            placeholder='Unit price'
                            onValueChange={setUnitPrice}
                            pattern={signedNumericRegExp}
                            isInvalid={!!unitPriceError}
                            value={unitPrice} />
                        <Form.Text>{unitPriceError}</Form.Text>
                    </Form.Group>
                </Row>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant='outline-primary' onClick={onHide}>Cancel</Button>
            <Button variant='primary'
                    onClick={handleStart}>
                Start
            </Button>
        </Modal.Footer>
    </Modal>
}
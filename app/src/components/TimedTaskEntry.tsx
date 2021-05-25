import {Button, ButtonGroup, Col, Form, Modal} from "react-bootstrap";
import AutoCompleteField from "./AutoCompleteField";
import searchWorkLog from "../api/searchWorkLog";
import {useCallback, useMemo, useState} from "react";
import useAuthProps from "../hooks/useAuthProps";
import {map} from "rxjs/operators";
import {isLeft} from "fp-ts/Either";
import saveWorkLog, {WorkLog} from "../api/saveWorkLog";
import {numericRegExp} from "../utils/numeric";
import * as t from "io-ts";
import * as codec from "io-ts-types";
import {currencyType, zonedDateTimeType} from "../api/codecs";
import {Duration, ZonedDateTime} from "@js-joda/core";
import {createEnumType} from "../utils/codecs";
import {usePersistedState} from "../hooks/usePersistedState";
import currency from 'currency.js';
import AlertDialog from "./AlertDialog";
import {v4 as uuid} from 'uuid';
import AttachmentSelect from "./AttachmentSelect";
import searchWorkLogCategory from "../api/searchWorkLogCategory";
import searchWorkLogSubCategory from "../api/searchWorkLogSubCategory";

export const timedTaskStateType = t.type({
    description: codec.NonEmptyString,
    created: zonedDateTimeType,
    category: codec.NonEmptyString,
    subCategory: t.string,
    unitPrice: currencyType,
});

export type TimedTaskState = t.TypeOf<typeof timedTaskStateType>;

export function computeDuration(state: TimedTaskState) {
    const duration = Duration.between(state.created, ZonedDateTime.now());
    const minutes = duration.toMinutes();
    let hours = 0;
    if (minutes > 60) {
        hours = Math.trunc(minutes / 60);
        return `${hours}h${minutes}m`
    } else {
        return `${minutes}m`;
    }
}

type Props = {
    state?: TimedTaskState | WorkLog,
    now?: ZonedDateTime,
    onStarted: (s: TimedTaskState) => unknown,
    onSaved: () => unknown,
    onHide: () => unknown,
    searchByDescription?: typeof searchWorkLog,
    searchCategory?: typeof searchWorkLogCategory,
    searchSubCategory?: typeof searchWorkLogSubCategory,
    save?: typeof saveWorkLog,
};

const allRoundingModes = ['1m', '15m', '30m', '1h'] as const;
type RoundingMode = typeof allRoundingModes[number];
const roundingModeType = createEnumType(allRoundingModes);

function computeUnit(state: TimedTaskState | WorkLog, now: ZonedDateTime, roundingMode: RoundingMode): string {
    const duration = Duration.between(state.created, now);
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

export default function TimedTaskEntry({
                                           onHide, onStarted, onSaved, state,
                                           now = ZonedDateTime.now(),
                                           searchByDescription: searchByDescFn = searchWorkLog,
                                           searchCategory: searchCategoryFn = searchWorkLogCategory,
                                           searchSubCategory: searchSubCategoryFn = searchWorkLogSubCategory,
                                           save: saveFn = saveWorkLog,
                                       }: Props) {
    const authProps = useAuthProps();

    const id = useMemo(() => state && 'id' in state ? state.id : uuid(), [state]);
    const [desc, setDesc] = useState<string>(state?.description ?? '');
    const [category, setCategory] = useState<string>(state?.category ?? '');
    const [subCategory, setSubCategory] = useState<string>(state?.subCategory ?? '');
    const [unitPrice, setUnitPrice] = useState<string>(state?.unitPrice?.toString() ?? '');
    const [roundingMode, setRoundingMode] = usePersistedState('task-entry-rounding-mode', roundingModeType, allRoundingModes[0]);
    const [unit, setUnit] = useState<string>(() => {
        if (!state) return '';
        if ('id' in state) {
            return state.unit.toString();
        }
        return computeUnit(state, now, roundingMode);
    });
    const [attachments, setAttachments] = useState<string[]>(state && 'attachments' in state ? state.attachments : []);

    const totalPrice = useMemo(() => {
        if (unit.trim().length === 0 || unitPrice.trim().length === 0) {
            return currency(0).format();
        }

        return currency(unitPrice).multiply(parseFloat(unit)).format();
    }, [unit, unitPrice]);

    const [isSaving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const searchByDesc = useCallback((term: string) => {
        return searchByDescFn({q: term}, authProps)
            .pipe(map(({data}) => data));
    }, [searchByDescFn, authProps]);

    const searchCategory = useCallback((term: string) => {
        return searchCategoryFn({q: term}, authProps);
    }, [searchCategoryFn, authProps]);

    const searchSubCategory = useCallback((term: string) => {
        return searchSubCategoryFn({q: term}, authProps);
    }, [searchSubCategoryFn, authProps]);

    const fillForm = (v: WorkLog) => {
        setCategory(v.category);
        setSubCategory(v.subCategory);
        setUnitPrice(v.unitPrice.toString());
        setDesc(v.description);
    };

    let isValidForm = desc.trim().length > 0 &&
        category.trim().length > 0 &&
        unitPrice.trim().length > 0;

    if (state) {
        isValidForm = isValidForm && unit.trim().length > 0;
    }

    const handleSubmit = () => {
        const result = {
            unitPrice: currency(unitPrice),
            subCategory: subCategory,
            category: category as codec.NonEmptyString,
            description: desc as codec.NonEmptyString
        };

        if (state) {
            setSaving(true);
            saveFn({
                ...result,
                id: id as codec.NonEmptyString,
                unit: currency(unit),
                created: state.created,
                attachments: attachments as codec.NonEmptyString[],
            }, authProps).subscribe(() => {
                setSaving(false);
                onSaved();
            }, (e) => {
                setSaveError(e?.message ?? 'Unknown error');
                setSaving(false);
            });
        } else {
            onStarted({
                ...result,
                created: now,
            });
            onHide();
        }
    };

    return <Modal show onHide={onHide}>
        <Modal.Header>
            {!state ? 'New timed task' : ('id' in state ? 'Edit work log' : 'Finishing a timed task')}
        </Modal.Header>
        <Modal.Body>
            <Form>
                {state && <Form.Row>
                    <Col>
                        <Form.Group>
                            <Form.Label>Start time</Form.Label>
                            <Form.Control type='input'
                                          value={new Date(state.created.toInstant().toEpochMilli()).toLocaleString()}
                                          disabled/>
                        </Form.Group>
                    </Col>
                </Form.Row>}
                <Form.Row>
                    <Col>
                        <Form.Group>
                            <Form.Label>Description (*)</Form.Label>
                            <AutoCompleteField
                                placeholder='Enter your description'
                                search={searchByDesc}
                                onChange={(v) => {
                                    if (isLeft(v)) {
                                        setDesc(v.left ?? '');
                                    } else {
                                        fillForm(v.right);
                                    }
                                }}
                                getLabel={v => v.description}
                                value={desc}/>
                        </Form.Group>
                    </Col>
                </Form.Row>
                <Form.Row>
                    <Col>
                        <Form.Group>
                            <Form.Label>Category (*)</Form.Label>
                            <AutoCompleteField
                                search={searchCategory}
                                placeholder='Enter your category'
                                onChange={(v) => {
                                    if (isLeft(v)) {
                                        setCategory(v.left ?? '');
                                    } else {
                                        setCategory(v.right);
                                    }
                                }}
                                getLabel={v => v}
                                value={category}/>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Subcategory</Form.Label>
                            <AutoCompleteField
                                search={searchSubCategory}
                                placeholder='Enter your subCategory'
                                onChange={(v) => {
                                    if (isLeft(v)) {
                                        setSubCategory(v.left ?? '');
                                    } else {
                                        setSubCategory(v.right);
                                    }
                                }}
                                getLabel={v => v}
                                value={subCategory}/>
                        </Form.Group>
                    </Col>
                </Form.Row>

                <Form.Row>
                    <Col>
                        <Form.Group>
                            <Form.Label>Hourly price (*)</Form.Label>
                            <Form.Control
                                type='input'
                                placeholder='Enter your hourly price'
                                onChange={(e) => {
                                    if (e.target.value.length === 0 || numericRegExp.test(e.target.value)) {
                                        setUnitPrice(e.target.value);
                                    }
                                }}
                                value={unitPrice}/>

                        </Form.Group>
                    </Col>
                </Form.Row>

                {state && <Form.Row>
                    <Col>
                        <Form.Group>
                            <Form.Label>Hours (*)</Form.Label>
                            <Form.Control
                                type='input'
                                onChange={(e) => {
                                    if (e.target.value.length === 0 || numericRegExp.test(e.target.value)) {
                                        setUnit(e.target.value);
                                    }
                                }}
                                value={unit}/>
                        </Form.Group>
                    </Col>
                    {!('id' in state) && <Col>
                        <Form.Group>
                            <Form.Label>Rounding</Form.Label>
                            <ButtonGroup>
                                {allRoundingModes.map(mode =>
                                    <Button key={mode}
                                            variant={roundingMode === mode ? 'primary' : 'outline-primary'}
                                            onClick={() => {
                                                setRoundingMode(mode);
                                                setUnit(computeUnit(state, now, mode).toString());
                                            }}
                                    >{mode}</Button>)}
                            </ButtonGroup>
                        </Form.Group>
                    </Col>}
                </Form.Row>}

                {state && <Form.Row>
                    <Col>
                        <Form.Group>
                            <Form.Label>Total price</Form.Label>
                            <Form.Control
                                type='input'
                                disabled
                                value={totalPrice}/>
                        </Form.Group>
                    </Col>
                </Form.Row>}

                {state && <Form.Row>
                    <Col>
                        <Form.Group>
                            <Form.Label>Attachments</Form.Label>
                            <AttachmentSelect value={attachments} onChange={setAttachments}/>
                        </Form.Group>
                    </Col>
                </Form.Row>}
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant='outline-primary' onClick={onHide}>Cancel</Button>
            <Button variant='primary'
                    disabled={!isValidForm || isSaving}
                    onClick={handleSubmit}>
                {isSaving ? 'Saving...' : (state ? 'Save' : 'Start')}
            </Button>
        </Modal.Footer>

        {saveError.length > 0 && <AlertDialog
            body={`Error: ${saveError}`}
            onCancel={() => setSaveError('')}
            onOk={() => setSaveError('')}/>}
    </Modal>
}
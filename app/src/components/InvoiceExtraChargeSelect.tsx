import {ExtraChargeAmountType, InvoiceExtraCharge} from "../api/invoices";
import {Alert, Button, FormControl, Table} from "react-bootstrap";
import React, {useMemo, useState} from "react";
import SortedArray from "../utils/SortedArray";
import currency from "currency.js";
import {formatAsCurrency} from "../utils/numeric";
import {NonEmptyString} from "io-ts-types";
import {parseLines} from "../utils/parsers";
import _ from "lodash";


type Props = {
    value: InvoiceExtraCharge[],
    onChange: (v: InvoiceExtraCharge[]) => unknown,
};

function compareCharge(lhs: InvoiceExtraCharge, rhs: InvoiceExtraCharge) {
    return lhs.priority - rhs.priority;
}

function amountToText(type: ExtraChargeAmountType, amount: any, withDollarSymbol: boolean) {
    switch (type) {
        case "percent":
            return `${Math.trunc(amount as number)}%`;
        case "absolute":
            return withDollarSymbol ? formatAsCurrency((amount as currency)) : (amount as currency).toString();
    }
}

function chargesToText(values: InvoiceExtraCharge[]) {
    return values.map(({name, type, amount}) =>
        `${name}: ${amountToText(type, amount, false)}`)
        .join('\n');
}

const percentPattern = /^([+-]?\d+\.?\d+%$)/;
const absolutePattern = /^([+-]?\d+\.?\d+$)/;

function textToCharges(text: string): InvoiceExtraCharge[] | string {
    const charges: InvoiceExtraCharge[] = [];
    let priority = 0;
    try {
        for (const {name, value} of parseLines(text)) {
            let amount;
            let type: ExtraChargeAmountType;
            let result;
            if ((result = percentPattern.exec(value))) {
                amount = currency(result[1]);
                type = 'percent';
            } else if ((result = absolutePattern.exec(value))) {
                amount = currency(result[1]);
                type = 'absolute';
            } else {
                return `Invalid value "${value}"`;
            }

            charges.push({
                type, amount, name: name as NonEmptyString, priority, description: '',
            });
            priority++;
        }
    } catch (e: any) {
        return e?.message ?? 'Unknown error';
    }

    // Find duplication
    if (charges.length > 0 && _.uniqBy(charges, ({name}) => name.toLowerCase()).length !== charges.length) {
        return "Duplications in the charges' names are not allowed";
    }

    return charges;
}


function Editor({value: initialValue, onChange, onHide}: Props & { onHide: () => unknown }) {
    const [value, setValue] = useState(() => chargesToText(initialValue));
    const [error, setError] = useState('');
    const handleConfirm = () => {
        const result = textToCharges(value);
        if (typeof result === 'string') {
            setError(result);
        } else {
            setError('');
            onChange(result);
        }
    };

    return <div>
        <FormControl as='textarea'
                     autoFocus
                     rows={5}
                     onChange={(e) => setValue(e.currentTarget.value)}
                     placeholder="Format as NAME: VALUE, separated by new line. Example: GST: 15%, Discount: -123.00">
            {value}
        </FormControl>
        <div style={{marginTop: 8}}>
            {error.length > 0 &&
            <Alert variant='danger' dismissible onClose={() => setError('')}>
                {error}
            </Alert>
            }
            <Button size='sm' variant='outline-primary' onClick={handleConfirm}>Confirm</Button>&nbsp;
            <Button size='sm' variant='outline-secondary' onClick={onHide}>Cancel</Button>
        </div>
    </div>
}

export default function InvoiceExtraChargeSelect({onChange, value: rawValue}: Props) {
    const rows = useMemo(() => new SortedArray(rawValue, compareCharge).backingArray(), [rawValue]);
    const [editing, setEditing] = useState(false);

    return <>
        {editing && <Editor value={rawValue}
                            onHide={() => setEditing(false)}
                            onChange={(v) => {
                                onChange(v);
                                setEditing(false);
                            }}
        />}
        {!editing && <Table hover size='sm' responsive>
            <thead>
            <tr>
                <th>Name</th>
                <th>Amount</th>
            </tr>
            </thead>
            <tbody>
            {rows.map((r) => <tr key={r.priority}>
                <td>{r.name}</td>
                <td>{amountToText(r.type, r.amount, true)}</td>
            </tr>)}
            {rows.length === 0 && <tr>
                <td colSpan={4}>No extra charges</td>
            </tr>}

            </tbody>
            <tfoot>
            <tr>
                <td colSpan={4}><Button size='sm'
                                        onClick={() => setEditing(true)}
                                        variant='outline-primary'>Edit charges</Button></td>
            </tr>
            </tfoot>
        </Table>}
    </>
}

import {InvoiceExtraInfo} from "../api/invoices";
import {Button, Form, Table} from "react-bootstrap";
import _ from "lodash";
import {joinLines, parseLines} from "../utils/parsers";
import {NonEmptyString} from "io-ts-types";
import {useMemo, useState} from "react";
import useFormField from "../hooks/useFormField";
import ValueFormControl from "./ValueFormControl";
import {flexContainer, flexItem} from "../styles/common";

type Props = {
    value: InvoiceExtraInfo[],
    onChange: (v: InvoiceExtraInfo[]) => unknown,
};

function textToInfo(text: string): InvoiceExtraInfo[] | string {
    const rs: InvoiceExtraInfo[] = [];
    try {
        let priority = 0;
        for (const {name, value} of parseLines(text)) {
            rs.push({name: name as NonEmptyString, value, priority});
            priority++;
        }
    } catch (e: any) {
        return e?.message ?? 'Unknown error';
    }

    // Find duplication
    if (rs.length > 0 && _.uniqBy(rs, ({name}) => name.toLowerCase()).length !== rs.length) {
        return 'Value contains duplicated names';
    }

    return rs;
}

function infoToText(info: InvoiceExtraInfo[]) {
    return joinLines(info);
}

function Editor({value: initialValue, onChange, onHide}: Props & {onHide: () => unknown}) {
    const [value, setValue, valueError, checkValue] = useFormField(() => infoToText(initialValue), {required: false});
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        if (!checkValue()) {
            return;
        }

        const rs = textToInfo(value);
        if (typeof rs === 'string') {
            setError(rs);
        } else {
            setError('');
            onChange(rs);
        }
    }

    return <Form.Group>
        <ValueFormControl
            as='textarea'
            rows={5}
            placeholder='Separate by new line. e.g. Client address: xxxx'
            value={value}
            onValueChange={setValue}
            isInvalid={!!valueError}
        />
        {(valueError || error) && <Form.Text>{valueError || error}</Form.Text>}
        <div style={flexContainer}>
            <Button style={flexItem} size='sm' variant='outline-primary' onClick={handleSave}>Save</Button>
            <Button style={flexItem} size='sm' variant='outline-secondary' onClick={onHide}>Cancel</Button>
        </div>
    </Form.Group>
}

export default function InvoiceExtraInfoSelect({value: rawValue, onChange}: Props) {
    const value = useMemo(() => _.sortBy(rawValue, 'name'), [rawValue]);
    const rows = useMemo(() => value.map((info) => <tr key={info.name}>
        <td>{info.name}</td>
        <td>{info.value}</td>
    </tr>), [value]);

    const [editing, setEditing] = useState(false);

    if (editing) {
        return <Editor value={value}
                       onHide={() => setEditing(false)}
                       onChange={(v) => {
            onChange(v);
            setEditing(false);
        }}/>
    }

    return <Table responsive hover size='sm'>
        <thead>
        <tr>
            <th>Name</th>
            <th>Value</th>
        </tr>
        </thead>
        <tbody>
        {rows}
        {value.length === 0 && <tr>
            <td colSpan={2}>No extra info</td>
        </tr>}
        </tbody>
        <tfoot>
        <tr>
            <td colSpan={2}>
                <Button variant='outline-primary'
                        size='sm'
                        onClick={() => setEditing(true)}>
                    Edit info
                </Button>
            </td>
        </tr>
        </tfoot>
    </Table>;
}

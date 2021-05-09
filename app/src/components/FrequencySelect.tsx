import {Frequency} from "../api/getSumReport";
import {useMemo} from "react";
import {Button, ButtonGroup} from "react-bootstrap";

const allFrequencies: Frequency[] = ['Monthly', 'Weekly', 'Daily', 'Yearly'];

export function FrequencySelect({value, onChange}: { value: Frequency, onChange: (f: Frequency) => unknown }) {
    const buttons = useMemo(() => allFrequencies.map((v) =>
            <Button
                onClick={() => onChange(v)}
                variant={v === value ? 'primary' : 'outline-primary'}>
                {v}
            </Button>),
        [onChange, value]);

    return <ButtonGroup size='sm'>
        {buttons}
    </ButtonGroup>;
}
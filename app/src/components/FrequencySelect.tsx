import {useMemo} from "react";
import {Button, ButtonGroup} from "react-bootstrap";
import {allFrequencies, Frequency} from "../models/frequency";


export function FrequencySelect({value, onChange}: { value: Frequency, onChange: (f: Frequency) => unknown }) {
    const buttons = useMemo(() => allFrequencies.map((v) =>
            <Button
                key={`freq-${v}`}
                onClick={() => onChange(v)}
                variant={v === value ? 'primary' : 'outline-primary'}>
                {v}
            </Button>),
        [onChange, value]);

    return <ButtonGroup size='sm'>
        {buttons}
    </ButtonGroup>;
}
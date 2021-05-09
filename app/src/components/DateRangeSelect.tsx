import {Button, ButtonGroup, Dropdown, DropdownButton, Form, FormControl, SplitButton} from "react-bootstrap";
import {LocalDate} from "@js-joda/core";
import {useEffect, useMemo, useState} from "react";
import _ from "lodash";

export type DateRange = {
    start?: LocalDate;
    end?: LocalDate;
};

interface PredefinedRange {
    type: 'predefined',
    label: string,
    computeRange: (today: LocalDate) => DateRange;
}

const lastYear: PredefinedRange = {
    type: 'predefined',
    label: 'Last year',
    computeRange: (today) => {
        const start = today.minusYears(1).withDayOfYear(1);
        const end = start.plusYears(1).minusDays(1);
        return {start, end};
    }
}

const currentYear: PredefinedRange = {
    type: 'predefined',
    label: 'Current year',
    computeRange: (today) => {
        return {start: today.withDayOfYear(1)};
    }
}

const pastYear: PredefinedRange = {
    type: 'predefined',
    label: 'Past 12 months',
    computeRange: (today) => {
        return {start: today.minusYears(1).withDayOfMonth(1)};
    }
}

const allTime: PredefinedRange = {
    type: 'predefined',
    label: 'All time',
    computeRange: (today) => {
        return {};
    }
}

type DateRangeType = PredefinedRange | {
    type: 'custom',
    value: DateRange,
}

type Props = {
    onChange: (v: DateRange) => unknown,
    persistKey?: string,
}

const predefinedRanges = [currentYear, lastYear, pastYear, allTime];

function persistRange(v: DateRangeType, key: string) {
    if (v.type === 'predefined') {
        localStorage.setItem(key, JSON.stringify({type: v.type, label: v.label}));
    } else {
        localStorage.setItem(key, JSON.stringify(v));
    }
}

function loadRange(key: string) {
    const v = localStorage.getItem(key);
    if (!v) {
        return undefined;
    }

    const value = JSON.parse(v);
    if (value.type === 'predefined') {
        return predefinedRanges.find((r) => r.label === value.label);
    } else {
        return value;
    }
}

export default function DateRangeSelect({onChange, persistKey}: Props) {
    const [selected, setSelected] = useState<DateRangeType>(() => {
        return persistKey ? (loadRange(persistKey) ?? predefinedRanges[0]) : predefinedRanges[0];

    });

    useEffect(() => {
        if (persistKey) {
            persistRange(selected, persistKey);
        }
    }, [persistKey, selected]);

    useEffect(() => {
        onChange(selected.type === 'predefined' ? selected.computeRange(LocalDate.now()) : selected.value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    const predefinedButtons = useMemo(() => {
        return predefinedRanges.map((r) =>
            <Button variant={selected === r ? 'primary' : 'outline-primary'}
                    onClick={() => setSelected(r)}>
                {r.label}
            </Button>)
    }, [selected]);


    return <ButtonGroup size='sm'>
        {predefinedButtons}

        <Button variant={selected.type === 'custom' ? 'primary' : 'outline-primary'}
                onClick={() => {
                    if (selected.type !== 'custom') {
                        setSelected({type: 'custom', value: {}})
                    }
                }}>
           Custom
        </Button>
    </ButtonGroup>
}
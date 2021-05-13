import {Button, ButtonGroup} from "react-bootstrap";
import {LocalDate} from "@js-joda/core";
import {useEffect, useMemo, useState} from "react";

export type DateRange = {
    start?: LocalDate;
    end?: LocalDate;
};

interface PredefinedRange {
    type: 'predefined',
    name: string,
    label: ((today: LocalDate) => string) | string,
    computeRange: (today: LocalDate) => DateRange;
}

const lastYear: PredefinedRange = {
    type: 'predefined',
    name: 'lastYear',
    label: (today: LocalDate) => {
        return today.minusYears(1).year().toString();
    },
    computeRange: (today) => {
        const start = today.minusYears(1).withDayOfYear(1);
        const end = start.plusYears(1).minusDays(1);
        return {start, end};
    }
}

const currentYear: PredefinedRange = {
    type: 'predefined',
    name: 'currentYear',
    label: (today) => today.year().toString(),
    computeRange: (today) => {
        return {start: today.withDayOfYear(1)};
    }
}

const pastYear: PredefinedRange = {
    type: 'predefined',
    name: 'pastYear',
    label: 'Past 12 months',
    computeRange: (today) => {
        return {start: today.minusYears(1).withDayOfMonth(1)};
    }
}

const allTime: PredefinedRange = {
    type: 'predefined',
    label: 'All',
    name: 'all',
    computeRange: () => {
        return {};
    }
}

type DateRangeType = PredefinedRange | {
    type: 'custom',
    value: DateRange,
}

type Props = {
    onChange: (v: DateRange) => unknown,
    now?: LocalDate,
    persistKey?: string,
}

const predefinedRanges = [currentYear, lastYear, pastYear, allTime];

function persistRange(v: DateRangeType, key: string) {
    if (v.type === 'predefined') {
        localStorage.setItem(key, JSON.stringify({type: v.type, name: v.name}));
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
        return predefinedRanges.find((r) => r.name === value.name);
    } else {
        return value;
    }
}

export default function DateRangeSelect({onChange, persistKey, now}: Props) {
    const today = useMemo(() => now ?? LocalDate.now(), [now]);
    const [selected, setSelected] = useState<DateRangeType>(() => {
        return persistKey ? (loadRange(persistKey) ?? predefinedRanges[0]) : predefinedRanges[0];

    });

    useEffect(() => {
        if (persistKey) {
            persistRange(selected, persistKey);
        }
    }, [persistKey, selected]);

    useEffect(() => {
        onChange(selected.type === 'predefined' ? selected.computeRange(today) : selected.value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [today, selected]);

    const predefinedButtons = useMemo(() => {
        return predefinedRanges.map((r) => {
            const label = typeof r.label === 'string' ? r.label : r.label(today);
            return <Button variant={selected === r ? 'primary' : 'outline-primary'}
                           key={`predefined-${label}`}
                           onClick={() => setSelected(r)}>
                {label}
            </Button>;
        })
    }, [today, selected]);


    return <ButtonGroup size='sm'>
        {predefinedButtons}
    </ButtonGroup>
}
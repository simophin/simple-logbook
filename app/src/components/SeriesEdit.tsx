import { Dropdown, DropdownButton, FormControl, InputGroup } from "react-bootstrap";
import DropdownItem from "react-bootstrap/DropdownItem";
import AccountSelect from "./AccountSelect";
import { CirclePicker } from 'react-color';
import { createEnumType } from "../utils/codecs";
import * as t from 'io-ts';
import { NonEmptyString } from "io-ts-types";
import React from "react";

const allSeriesTypes = ['Income', 'Expense'] as const;

const seriesType = createEnumType(allSeriesTypes);

export const seriesConfigType = t.intersection([t.type({
    id: t.string,
    accounts: t.array(NonEmptyString),
    name: t.string,
    type: seriesType,
    visible: t.boolean,
}), t.partial({
    color: t.string,
})]);

export const seriesConfigArrayType = t.array(seriesConfigType);

export type SeriesConfig = t.TypeOf<typeof seriesConfigType>;

type SeriesEditProps = {
    value: SeriesConfig,
    onChange: (config: SeriesConfig) => unknown,
    removable: boolean,
    addSeries: () => unknown,
    removeSeries: (id: SeriesConfig['id']) => unknown,
};

const allIncomeColors = [
    '#03A9F4',
    '#4CAF50',
    '#3F51B5',
];
const allExpenseColors = [
    '#FFC107',
    '#FF5722',
    '#E91E63',
];

function hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}


export function getSeriesColor({ id, type, color }: SeriesConfig) {
    if (color) {
        return color;
    }

    const colors = (type === 'Income') ? allIncomeColors : allExpenseColors;
    return colors[hashString(id) % colors.length];
}

export function SeriesEdit({ value, onChange, addSeries, removable, removeSeries }: SeriesEditProps) {
    return <InputGroup size='sm'>
        <DropdownButton size='sm' title={`${value.name} (${value.type})`}>
            <FormControl
                type='text'
                size='sm'
                autoFocus
                className="mx-3 my-2 w-auto"
                placeholder='Rename this series'
                value={value.name}
                onChange={(e) =>
                    onChange({ ...value, name: e.target.value as NonEmptyString })} />
            <Dropdown.Header>Show as</Dropdown.Header>
            <DropdownItem active={value.type === 'Income'}
                onClick={() => onChange({ ...value, type: 'Income' })}>
                Income
            </DropdownItem>
            <DropdownItem active={value.type === 'Expense'}
                onClick={() => onChange({ ...value, type: 'Expense' })}>
                Expense
            </DropdownItem>

            <Dropdown.Divider />

            <DropdownItem onClick={addSeries}>Add a series</DropdownItem>
            {removable &&
                <DropdownItem onClick={() => removeSeries(value.id)}>Remove this series</DropdownItem>}

            <Dropdown.Divider />
            <Dropdown.Header>Color</Dropdown.Header>
            <DropdownItem>
                <CirclePicker
                    color={value.color}
                    onChange={(c) => onChange({ ...value, color: `${c.hex}` })} />
            </DropdownItem>
        </DropdownButton>
        <AccountSelect
            placeholder='Select account(s)'
            selectedGroups={[]}
            onGroupsChange={() => { }}
            onChange={(accounts) => onChange({ ...value, accounts: accounts as NonEmptyString[] })}
            selected={value.accounts} />
        <InputGroup.Checkbox checked={value.visible}
            onChange={() => onChange({ ...value, visible: !value.visible })}
        />
    </InputGroup>;
}
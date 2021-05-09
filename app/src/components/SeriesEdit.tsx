import {Dropdown, DropdownButton, FormControl, InputGroup} from "react-bootstrap";
import DropdownItem from "react-bootstrap/DropdownItem";
import AccountSelect from "./AccountSelect";
import {CirclePicker} from 'react-color';

type SeriesType = 'Income' | 'Expense';

export type SeriesConfig = {
    id: string,
    accounts: string[],
    name: string,
    type: SeriesType,
    color?: string,
};

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

function hashString(str: string){
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}


export function getSeriesColor({id, type, color}: SeriesConfig) {
    if (color) {
        return color;
    }

    const colors = (type === 'Income') ? allIncomeColors : allExpenseColors;
    return colors[hashString(id) % colors.length];
}

export function SeriesEdit({value, onChange, addSeries, removable, removeSeries}: SeriesEditProps) {
    return <InputGroup size='sm'>
        <InputGroup.Prepend>
            <DropdownButton size='sm' title={`${value.name} (${value.type})`}>
                <FormControl
                    type='text'
                    size='sm'
                    autoFocus
                    className="mx-3 my-2 w-auto"
                    placeholder='Rename this series'
                    value={value.name}
                    onChange={(e) =>
                        onChange({...value, name: e.target.value})}/>
                <Dropdown.Header>Show as</Dropdown.Header>
                <DropdownItem active={value.type === 'Income'}
                              onSelect={() => onChange({...value, type: 'Income'})}>
                    Income
                </DropdownItem>
                <DropdownItem active={value.type === 'Expense'}
                              onSelect={() => onChange({...value, type: 'Expense'})}>
                    Expense
                </DropdownItem>

                <Dropdown.Divider/>

                <DropdownItem onSelect={addSeries}>Add a series</DropdownItem>
                {removable &&
                <DropdownItem onSelect={() => removeSeries(value.id)}>Remove this series</DropdownItem>}

                <Dropdown.Divider/>
                <Dropdown.Header>Color</Dropdown.Header>
                <DropdownItem>
                    <CirclePicker
                        color={value.color}
                        onChange={(c) => onChange({...value, color: `${c.hex}`})} />
                </DropdownItem>
            </DropdownButton>
        </InputGroup.Prepend>
        <AccountSelect
            placeholder='Select account(s)'
            onChange={(accounts) => onChange({...value, accounts})}
            selected={value.accounts}/>
    </InputGroup>;
}
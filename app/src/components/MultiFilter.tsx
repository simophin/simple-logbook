import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import {FormControl, InputGroup} from "react-bootstrap";
import {PencilIcon, SearchIcon} from "@primer/octicons-react";
import AccountSelect from "./AccountSelect";
import ValueFormControl from "./ValueFormControl";
import {useMediaPredicate} from "react-media-hook";

export type Filter = {
    accounts?: string[],
    q: string,
    from?: string,
    to?: string,
};

type Props = {
    value: Filter,
    onChanged: (filter: Filter) => unknown,
}

export default function MultiFilter({value, onChanged}: Props) {
    const bigScreen = useMediaPredicate('(min-width: 800px)');
    const {q, accounts, from, to} = value;

    return <div style={flexContainer}>
        <span style={bigScreen ? {...flexItem, flex: 2} : flexFullLineItem}>
            <InputGroup size='sm'>
                <InputGroup.Prepend>
                    <InputGroup.Text><SearchIcon size={12}/></InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                    value={q}
                    onChange={(e) => onChanged({...value, q: e.target.value})}
                    type='text'
                    placeholder='Search'/>
            </InputGroup>
        </span>


        <span style={bigScreen ? {...flexItem, flex: 3} : flexFullLineItem}>
            <InputGroup size='sm'>
                <InputGroup.Prepend>
                    <InputGroup.Text><PencilIcon size={12}/></InputGroup.Text>
                </InputGroup.Prepend>
                <AccountSelect
                    placeholder='Accounts'
                    selected={accounts}
                    onChange={accounts => onChanged({...value, accounts})}/>
            </InputGroup>
        </span>

        <div style={{...flexFullLineItem, ...flexContainer, margin: 0, padding: 0}}>
            <InputGroup size='sm' as='span' style={bigScreen ? {...flexItem, flex: 1} : flexFullLineItem}>
                <InputGroup.Prepend>
                    <InputGroup.Text>From</InputGroup.Text>
                </InputGroup.Prepend>
                <ValueFormControl
                    value={from}
                    onValueChange={from => onChanged({...value, from})}
                    type='date'/>
            </InputGroup>

            <InputGroup size='sm' as='span' style={bigScreen ? {...flexItem, flex: 1} : flexFullLineItem}>
                <InputGroup.Prepend>
                    <InputGroup.Text>To</InputGroup.Text>
                </InputGroup.Prepend>
                <ValueFormControl
                    value={to}
                    onValueChange={to => onChanged({...value, to})}
                    type='date'/>
            </InputGroup>

        </div>
    </div>
}

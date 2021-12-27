import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import {FormControl, InputGroup} from "react-bootstrap";
import {PencilIcon, SearchIcon} from "@primer/octicons-react";
import AccountSelect from "./AccountSelect";
import ValueFormControl from "./ValueFormControl";
import {useMediaPredicate} from "react-media-hook";
import {useDebounce} from "../hooks/useDebounce";
import {useEffect, useState} from "react";
import {LocalDate} from "@js-joda/core";

export type Filter = {
    accounts?: string[],
    q?: string,
    from?: LocalDate,
    to?: LocalDate,
};

type Props = {
    onChanged: (filter: Filter) => unknown,
}

export default function MultiFilter({onChanged}: Props) {
    const bigScreen = useMediaPredicate('(min-width: 800px)');

    const [searchTerm, setSearchTerm] = useState('');
    const [accounts, setAccounts] = useState<string[]>([]);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const debouncedSearchTerm = useDebounce(searchTerm, 200);

    useEffect(() => {
        onChanged({
            accounts: accounts.length === 0 ? undefined : accounts,
            from: from.length > 0 ? LocalDate.parse(from) : undefined,
            to: to.length > 0 ? LocalDate.parse(to) : undefined,
            q: debouncedSearchTerm.length === 0 ? undefined : debouncedSearchTerm,
        });
    }, [debouncedSearchTerm, accounts, from, to, onChanged]);

    return <div style={flexContainer}>
        <span style={bigScreen ? {...flexItem, flex: 2} : flexFullLineItem}>
            <InputGroup size='sm'>
                <InputGroup.Prepend>
                    <InputGroup.Text><SearchIcon size={12}/></InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                    onChange={setAccounts}/>
            </InputGroup>
        </span>

        <div style={{...flexFullLineItem, ...flexContainer, margin: 0, padding: 0}}>
            <InputGroup size='sm' as='span' style={bigScreen ? {...flexItem, flex: 1} : flexFullLineItem}>
                <InputGroup.Prepend>
                    <InputGroup.Text>From</InputGroup.Text>
                </InputGroup.Prepend>
                <ValueFormControl
                    value={from}
                    onValueChange={setFrom}
                    type='date'/>
            </InputGroup>

            <InputGroup size='sm' as='span' style={bigScreen ? {...flexItem, flex: 1} : flexFullLineItem}>
                <InputGroup.Prepend>
                    <InputGroup.Text>To</InputGroup.Text>
                </InputGroup.Prepend>
                <ValueFormControl
                    value={to}
                    onValueChange={setTo}
                    type='date'/>
            </InputGroup>

        </div>
    </div>
}

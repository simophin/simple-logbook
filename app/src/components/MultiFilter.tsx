import { flexContainer, flexFullLineItem, flexItem } from "../styles/common";
import { FormControl, InputGroup } from "react-bootstrap";
import { PencilIcon, SearchIcon } from "@primer/octicons-react";
import AccountSelect from "./AccountSelect";
import ValueFormControl from "./ValueFormControl";
import { useMediaPredicate } from "react-media-hook";
import { useDebounce } from "../hooks/useDebounce";
import { useEffect, useState } from "react";
import { LocalDate } from "@js-joda/core";
import TagSelect from "./TagSelect";
import { NonEmptyString } from "io-ts-types";

export type Filter = {
    accounts?: string[],
    q?: string,
    from?: LocalDate,
    to?: LocalDate,
    tags?: string[],
};

type Props = {
    initialFilter?: Filter,
    onChanged: (filter: Filter) => unknown,
}

export default function MultiFilter({ onChanged, initialFilter }: Props) {
    const bigScreen = useMediaPredicate('(min-width: 800px)');

    const [searchTerm, setSearchTerm] = useState(initialFilter?.q ?? '');
    const [accounts, setAccounts] = useState<string[]>(initialFilter?.accounts ?? []);
    const [from, setFrom] = useState(initialFilter?.from?.toString() ?? '');
    const [to, setTo] = useState(initialFilter?.to?.toString() ?? '');
    const [tags, setTags] = useState<NonEmptyString[]>((initialFilter?.tags ?? []) as NonEmptyString[]);

    const debouncedSearchTerm = useDebounce(searchTerm, 200);

    useEffect(() => {
        onChanged({
            accounts: accounts.length === 0 ? undefined : accounts,
            from: from.length > 0 ? LocalDate.parse(from) : undefined,
            to: to.length > 0 ? LocalDate.parse(to) : undefined,
            q: debouncedSearchTerm.length === 0 ? undefined : debouncedSearchTerm,
            tags: tags as string[],
        });
    }, [debouncedSearchTerm, accounts, from, to, tags, onChanged]);

    return <div style={flexContainer}>
        <span style={bigScreen ? { ...flexItem, flex: 2 } : flexFullLineItem}>
            <InputGroup size='sm'>
                <InputGroup.Text id="search-label"><SearchIcon size={12} /></InputGroup.Text>
                <FormControl
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    type='text'
                    aria-label='Search'
                    aria-describedby="search-label"
                    placeholder='Search' />
            </InputGroup>
        </span>


        <span style={bigScreen ? { ...flexItem, flex: 3 } : flexFullLineItem}>
            <InputGroup size='sm'>
                <InputGroup.Text><PencilIcon size={12} /></InputGroup.Text>
                <AccountSelect
                    placeholder='Accounts'
                    selected={accounts}
                    onChange={setAccounts} />
            </InputGroup>
        </span>

        <div style={{ ...flexFullLineItem, ...flexContainer, margin: 0, padding: 0 }}>
            <InputGroup size='sm' as='span' style={bigScreen ? { ...flexItem, flex: 1 } : flexFullLineItem}>
                <InputGroup.Text>From</InputGroup.Text>
                <ValueFormControl
                    value={from}
                    onValueChange={setFrom}
                    type='date' />
            </InputGroup>

            <InputGroup size='sm' as='span' style={bigScreen ? { ...flexItem, flex: 1 } : flexFullLineItem}>
                <InputGroup.Text>To</InputGroup.Text>
                <ValueFormControl
                    value={to}
                    onValueChange={setTo}
                    type='date' />
            </InputGroup>

        </div>

        <div style={{ ...flexFullLineItem }}>
            <InputGroup size='sm' as='span'>
                <InputGroup.Text>Tags</InputGroup.Text>
                <TagSelect tags={tags} onChanged={setTags} allowNew={false} />
            </InputGroup>
        </div>
    </div>
}

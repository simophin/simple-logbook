import {Typeahead, TypeaheadProps} from "react-bootstrap-typeahead";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import {useEffect, useState} from "react";
import {map} from "rxjs/operators";
import _ from "lodash";

type Props = {
    onChange: (selected: string[]) => unknown,
    persistedKey?: string,
    placeholder?: string,
};

export default function AccountSelect({onChange, persistedKey, ...props}: Props) {
    const accounts = useObservable(() =>
        listAccounts({})
            .pipe(map(v => _.map(v, 'name') as string[]))
        , []);
    const [selected, setSelected] = useState<string[]>(() => {
        if (persistedKey) {
            const stored = localStorage.getItem(persistedKey);
            if (!stored) {
                return [];
            }

            const parsed = JSON.parse(stored);
            if (_.isArray(parsed)) {
                return parsed as string[];
            }
        }
        return [];
    });

    useEffect(() => {
        if (persistedKey && selected.length > 0) {
            localStorage.setItem(persistedKey, JSON.stringify(selected));
        } else if (persistedKey) {
            localStorage.removeItem(persistedKey);
        }

        onChange(selected);
        // eslint-disable-next-line
    }, [selected, persistedKey])

    return <Typeahead
        options={getLoadedValue(accounts) ?? []}
        multiple
        size='sm'
        selected={selected}
        onChange={(selected) => setSelected(selected)}
        {...props}
    />
}
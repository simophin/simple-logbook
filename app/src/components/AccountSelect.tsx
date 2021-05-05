import {Typeahead, TypeaheadProps} from "react-bootstrap-typeahead";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import {useEffect, useState} from "react";
import {map} from "rxjs/operators";
import _ from "lodash";

type Props = {
    onChange: (selected: string[]) => unknown,
    selected: string[],
    placeholder?: string,
};

export default function AccountSelect({onChange, selected, ...props}: Props) {
    const accounts = useObservable(() =>
        listAccounts({})
            .pipe(map(v => _.map(v, 'name') as string[]))
        , []);

    return <Typeahead
        options={getLoadedValue(accounts) ?? []}
        multiple
        size='sm'
        selected={selected}
        onChange={(selected) => onChange(selected)}
        {...props}
    />
}
import {InputProps, Typeahead} from "react-bootstrap-typeahead";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import {map} from "rxjs/operators";
import _ from "lodash";

type Props = {
    onChange: (selected: string[]) => unknown,
    selected: string[],
    placeholder?: string,
    inputProps?: InputProps,
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
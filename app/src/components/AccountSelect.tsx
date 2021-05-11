import {InputProps, Typeahead} from "react-bootstrap-typeahead";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import {map} from "rxjs/operators";
import _ from "lodash";
import useAuthProps from "../hooks/useAuthProps";
import useObservableErrorReport from "../hooks/useObservableErrorReport";

type Props = {
    onChange: (selected: string[]) => unknown,
    selected: string[],
    placeholder?: string,
    inputProps?: InputProps,
};

export default function AccountSelect({onChange, selected, ...props}: Props) {
    const authProps = useAuthProps();
    const accounts = useObservable(() =>
        listAccounts({}, authProps)
            .pipe(map(v => _.map(v, 'name') as string[]))
        , [authProps]);
    useObservableErrorReport(accounts);

    return <Typeahead
        id="account-select"
        options={getLoadedValue(accounts) ?? []}
        multiple
        size='sm'
        selected={selected}
        onChange={(selected) => onChange(selected)}
        {...props}
    />
}
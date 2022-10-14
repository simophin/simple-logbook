import { Typeahead } from "react-bootstrap-typeahead";
import { getLoadedValue, useObservable } from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import listAccountGroups from "../api/listAccountGroup";
import { map } from "rxjs/operators";
import useAuthProps from "../hooks/useAuthProps";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import { TypeaheadInputProps, Option as THOption } from "react-bootstrap-typeahead/types/types";
import { zip } from "rxjs";
import _ from "lodash";

type Props = {
    onChange: (selected: string[]) => unknown,
    selected: string[],
    onGroupsChange: (selected: string[]) => unknown,
    selectedGroups: string[],
    placeholder?: string,
    inputProps?: TypeaheadInputProps,
};

type Option = {
    type: "account",
    name: string
} | {
    type: "group",
    name: string
};

function formatGroupLabel(groupName: string) {
    return `Group: ${groupName}`
}

function formatAccountLabel(accountName: string) {
    return accountName;
}

export default function AccountSelect({ onChange, selected, onGroupsChange, selectedGroups, ...props }: Props) {
    const authProps = useAuthProps();
    const result = useObservable(() =>
        zip(
            listAccounts({}, authProps),
            listAccountGroups(authProps),
        ).pipe(map(([accounts, groups]) => [
            ...groups.map(group => ({
                type: 'group',
                name: group.groupName
            })),
            ...accounts.map(acc => ({
                type: 'account',
                name: acc.name,
            } as Option)),
        ]))
        , [authProps]);
    useObservableErrorReport(result);

    const selectedOptions = [
        ...selectedGroups.map(name => ({ type: 'group', name } as Option)),
        ...selected.map(name => ({ type: 'account', name } as Option)),
    ];

    return <Typeahead
        id="account-select"
        options={getLoadedValue(result) ?? []}
        multiple
        size='sm'
        labelKey={(opt: THOption) => {
            if (typeof opt === 'object') {
                switch (opt.type) {
                    case 'account': return formatAccountLabel(opt.name);
                    case 'group': return formatGroupLabel(opt.name);
                }
            }
            return '';
        }}
        selected={selectedOptions}
        onChange={(selected) => {
            const items: Array<Option> = selected as unknown as Array<Option>;
            const [accounts, groups] = _.partition(items, ({ type }) => type === 'account');
            onChange(_.map(accounts, 'name'));
            onGroupsChange(_.map(groups, 'name'));
        }}
        {...props}
    />
}
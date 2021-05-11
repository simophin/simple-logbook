import {AccountGroup} from "../models/AccountGroup";
import {Button, Dropdown, SplitButton} from "react-bootstrap";
import {CSSProperties, useEffect, useMemo, useState} from "react";
import {useObservable} from "../hooks/useObservable";
import listAccountGroups from "../api/listAccountGroup";
import {map} from "rxjs/operators";
import _ from "lodash";
import {flexContainer, flexItem} from "../styles/common";
import replaceAccountGroups from "../api/replaceAccountGroups";
import {PlusIcon} from "@primer/octicons-react";
import {EditState} from "../utils/EditState";
import AsyncConfirm from "./AsyncConfirm";
import AccountGroupEntry from "./AccountGroupEntry";
import useAuthProps from "../hooks/useAuthProps";
import useObservableErrorReport from "../hooks/useObservableErrorReport";

type Props = {
    onChange: (a: AccountGroup | undefined) => unknown,
    persistKey?: string,
    style?: CSSProperties,
};

export default function AccountGroupSelect({onChange, persistKey, style}: Props) {
    const [selectedName, setSelectedName] = useState(() => {
        return persistKey ? (localStorage.getItem(persistKey) ?? '') : '';
    });
    const [reloadSeq, setReloadSeq] = useState(0);

    const [editState, setEditState] = useState<EditState<AccountGroup>>();

    const authProps = useAuthProps();
    const groups = useObservable(() => listAccountGroups(authProps)
        .pipe(
            map((groups) =>
                _.sortBy(groups, 'groupName'))
        ), [reloadSeq, authProps]);

    useObservableErrorReport(groups);

    const selectedGroup = useMemo(() => {
        if (groups.type !== 'loaded') {
            return undefined;
        }

        const index = _.sortedIndexOf(groups.data.map(g => g.groupName), selectedName);
        if (index >= 0) {
            return groups.data[index];
        }

        return undefined;
    }, [selectedName, groups]);

    useEffect(() => {
        onChange(selectedGroup);

        if (persistKey && selectedGroup) {
            localStorage.setItem(persistKey, selectedGroup.groupName);
        } else if (persistKey) {
            localStorage.removeItem(persistKey);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedGroup]);


    const children = (groups.type === 'loaded' ? groups.data : [])
        .map((ag) =>
            <SplitButton id={ag.groupName}
                         title={ag.groupName}
                         size='sm'
                         style={flexItem}
                         onClick={() => setSelectedName(ag.groupName)}
                         variant={ag.groupName === selectedGroup?.groupName ? 'primary' : 'light'}>
                <Dropdown.Item onClick={() =>
                    setEditState({state: 'edit', editing: ag})}>
                    Edit
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setEditState({state: 'delete', deleting: ag})}>
                    Delete
                </Dropdown.Item>
            </SplitButton>
        );

    return <div style={{...flexContainer, ...style}}>
        <Button id='all'
                style={flexItem}
                title='All accounts'
                onClick={() => setSelectedName('')}
                variant={selectedGroup ? 'light' : 'primary'}
                size='sm'>
            All accounts
        </Button>
        {children}
        <Button id='new'
                style={flexItem}
                title='New'
                variant='link'
                onClick={() => setEditState({state: 'new'})}
                size='sm'>
            <PlusIcon size='small'/>&nbsp;New group
        </Button>

        {editState?.state === 'delete' &&
        <AsyncConfirm
            body={`Are you sure to delete "${editState.deleting.groupName}"?`}
            doConfirm={() => replaceAccountGroups([{...editState.deleting, accounts: []}], authProps)}
            onCancel={() => setEditState(undefined)}
            onConfirmed={() => {
                setEditState(undefined);
                setReloadSeq(reloadSeq + 1);
            }}
            okText='Delete'
            okVariant='danger'
            confirmInProgressText='Deleting'/>
        }

        {(editState?.state === 'edit' || editState?.state === 'new') &&
        <AccountGroupEntry onClose={() => setEditState(undefined)}
                           onFinish={() => {
                               setEditState(undefined);
                               setReloadSeq(reloadSeq + 1);
                           }}
                           editing={editState.state === 'edit' ? editState.editing : undefined}/>
        }
    </div>;
}
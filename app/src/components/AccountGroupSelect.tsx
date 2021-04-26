import {AccountGroup} from "../models/AccountGroup";
import {Box, Chip, Container, Dialog, DialogContent, DialogTitle, PropTypes} from "@material-ui/core";
import {Add, Edit} from "@material-ui/icons";
import {CSSProperties, useCallback, useMemo, useState} from "react";
import {useObservable} from "../hooks/useObservable";
import listAccountGroups from "../api/listAccountGroup";
import {map} from "rxjs/operators";
import _ from "lodash";
import AccountGroupEntry from "./AccountGroupEntry";
import AlertDialog from "./AlertDialog";
import replaceAccountGroups from "../api/replaceAccountGroups";
import {flexContainer, flexFullLineItem} from "../styles/common";

type Props = {
    onSelected: (value: AccountGroup | undefined) => unknown,
    selectedColor?: Exclude<PropTypes.Color, 'inherit'>,
    persistedKey?: string,
}

const accountGroupButtonStyle: CSSProperties = {
    marginRight: 8,
    marginTop: 8
}

function sortAccountGroupAccounts(accountGroups: AccountGroup[]) {
    return accountGroups.map(({accounts, groupName}) => {
        return {
            groupName,
            accounts: _.sortBy(accounts),
        }
    });
}

interface NewGroupState {
    state: 'new',
}

interface EditGroupState {
    state: 'edit',
    value: AccountGroup,
}

interface DeleteGroupState {
    state: 'delete',
    groupName: string,
}

type ModifyGroupState = NewGroupState | EditGroupState | DeleteGroupState | undefined;

export default function AccountGroupSelect({persistedKey, onSelected, selectedColor = 'primary'}: Props) {
    const [reloadCounter, setReloadCounter] = useState(0);
    const accountGroups = useObservable(() =>
        listAccountGroups().pipe(map(sortAccountGroupAccounts)), [reloadCounter]);

    const [selectedName, setSelectedAccountGroup] = useState<string | undefined>(() => {
        return persistedKey ? (localStorage.getItem(persistedKey) ?? undefined) : undefined;
    });

    const [lastNotifiedGroup, setLastNotifiedGroup] = useState<AccountGroup | undefined>();

    const selected = useMemo(() => {
        return accountGroups.type === 'loaded'
            ? _.find(accountGroups.data, ({groupName}) => groupName === selectedName)
            : undefined;
    }, [accountGroups, selectedName]);

    if (lastNotifiedGroup !== selected) {
        onSelected(selected);
        setLastNotifiedGroup(selected);
        if (selected && persistedKey) {
            localStorage.setItem(persistedKey, selected.groupName);
        } else if (persistedKey) {
            localStorage.removeItem(persistedKey);
        }
    }

    const handleSelect = useCallback((group?: AccountGroup) => {
        setSelectedAccountGroup(group?.groupName);
    }, []);

    const [modifyState, setModifyState] = useState<ModifyGroupState>();

    const [pendingError, setPendingError] = useState('');

    const handleDeleteConfirm = useCallback(async (name: string) => {
        try {
            await replaceAccountGroups([{
                groupName: name,
                accounts: [],
            }]).toPromise();
            setReloadCounter(reloadCounter + 1);
        } catch (e) {
            setPendingError(`Error deleting account group: ${e?.message ?? 'Unknown error'}`);
        }
    }, []);

    return <Box style={{...flexContainer, width: '100%'}}>
        <Chip
            style={accountGroupButtonStyle}
            onClick={() => handleSelect()}
            label="All account groups"
            color={selectedName ? undefined : selectedColor}/>

        {
            accountGroups.type === 'loaded' && accountGroups.data.map((g) =>
                <Chip
                    label={g.groupName}
                    style={accountGroupButtonStyle}
                    onClick={() => handleSelect(g)}
                    onDelete={() => setModifyState({state: 'delete', groupName: g.groupName})}
                    color={selectedName === g.groupName ? selectedColor : 'default'}/>)
        }

        <Chip style={accountGroupButtonStyle}
              label="New group"
              onClick={() => setModifyState({state: 'new'})}
              icon={<Add/>}/>

        {selected &&
        <Chip style={accountGroupButtonStyle}
              label={`Edit "${selected.groupName}"`}
              onClick={() => setModifyState({state: 'edit', value: selected})}
        />
        }

        {(modifyState?.state === 'new' || modifyState?.state === 'edit') &&
        <Dialog
            open
            onClose={() => setModifyState(undefined)}
            disableEscapeKeyDown={true}
            fullScreen={true}
            aria-labelledby="ag-modify-dialog-title"
        >
            <DialogTitle id="ag-modify-dialog-title">
                {modifyState.state === 'new' && 'New account group'}
                {modifyState.state === 'edit' && `Edit account group "${modifyState.value.groupName}"`}
            </DialogTitle>
            <DialogContent>
                <Container>
                    <AccountGroupEntry
                        editing={modifyState.state === 'edit' ? modifyState.value : undefined}
                        onSubmit={() => {
                            setModifyState(undefined);
                            setReloadCounter(reloadCounter + 1);
                        }}
                        onClose={() => setModifyState(undefined)}/>
                </Container>
            </DialogContent>
        </Dialog>}


        {modifyState?.state === 'delete' &&
        <AlertDialog
            title={`Delete "${modifyState.groupName}"?`}
            positiveButton="Delete"
            negativeButton="Cancel"
            body="This only deletes the grouping of accounts. None of the transaction will be deleted."
            onNegativeClicked={() => setModifyState(undefined)}
            onPositiveClicked={() => {
                handleDeleteConfirm(modifyState.groupName);
                setReloadCounter(reloadCounter + 1);
                setModifyState(undefined);
            }}/>
        }
    </Box>
}
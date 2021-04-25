import {useObservable} from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import {CSSProperties, useCallback, useMemo, useState} from "react";
import {AccountGroup} from "../models/AccountGroup";
import _ from "lodash";
import {
    Button,
    Checkbox,
    CircularProgress,
    Container,
    FormControlLabel,
    Snackbar,
    TextField,
    Typography
} from "@material-ui/core";
import {map} from "rxjs/operators";
import replaceAccountGroups from "../api/replaceAccountGroups";

type Props = {
    editing?: AccountGroup;
    onSubmit?: () => unknown;
    onClose?: () => unknown;
}

const accountItemStyle: CSSProperties = {
    width: '100%',
};

const bottomButtonStyle: CSSProperties = {
    margin: 8,
};

export default function AccountGroupEntry({editing, onSubmit, onClose}: Props) {
    const [name, setName] = useState(editing?.groupName ?? '');
    const allAccounts = useObservable(() =>
        listAccounts({}).pipe(map((value) => _.sortBy(_.map(value, 'name')))), []);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>(() => {
        if (editing) {
            return _.sortBy(editing.accounts);
        } else {
            return [];
        }
    });
    const [filter, setFilter] = useState('');
    const accountsFiltered = useMemo(() => {
        if (allAccounts.type === 'loaded' && filter) {
            return _.filter(allAccounts.data,
                (name) => name.toLowerCase().indexOf(filter.toLowerCase()) >= 0);
        } else if (allAccounts.type === 'loaded') {
            return allAccounts.data;
        } else {
            return [];
        }
    }, [filter, allAccounts]);

    const handleAccountCheckboxChanged = useCallback((e) => {
        if (e.target.checked) {
            const index = _.sortedIndex(selectedAccounts, e.target.value);
            setSelectedAccounts([
                ...selectedAccounts.slice(0, index),
                e.target.value,
                ...selectedAccounts.slice(index)
            ]);
        } else {
            const index = _.sortedIndexOf(selectedAccounts, e.target.value);
            setSelectedAccounts([
                ...selectedAccounts.slice(0, index),
                ...selectedAccounts.slice(index + 1)
            ]);
        }
    }, [selectedAccounts]);

    const [isSaving, setSaving] = useState(false);
    const [pendingError, setPendingError] = useState('');

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const accountGroups: AccountGroup[] = [];
            const newName = name.trim();
            if (editing && editing.groupName.toLowerCase() !== newName) {
                accountGroups.push({accounts: [], groupName: editing.groupName});
            }
            accountGroups.push({
                accounts: selectedAccounts,
                groupName: newName,
            });
            await replaceAccountGroups(accountGroups).toPromise();
            if (onSubmit) {
                onSubmit();
            }
        } catch (e) {
            setPendingError(e.message ?? 'Unknown error');
        } finally {
            setSaving(false);
        }
    }, [editing, name, onSubmit, selectedAccounts]);

    return <Container style={{display: 'flex', flexWrap: 'wrap', justifyItems: 'center'}}>

        <TextField style={{width: '100%', marginBottom: 16}}
                   variant="outlined"
                   value={name}
                   placeholder="Group name"
                   onChange={(e) => setName(e.target.value)}
        />

        <Typography variant="caption" style={{width: '100%', marginBottom: 16}}>
            Select accounts
        </Typography>

        {accountsFiltered.length > 20 && <TextField style={{width: '100%', marginBottom: 16}}
                                                    variant="outlined"
                                                    value={filter}
                                                    onChange={(e) => setFilter(e.target.value)}
                                                    placeholder="Quick filter"
        />}

        {allAccounts.type === 'loading' && <CircularProgress size={30} style={{padding: 16}}/>}
        {accountsFiltered.map((name) =>
            <FormControlLabel
                style={accountItemStyle}
                control={<Checkbox
                    value={name}
                    onChange={handleAccountCheckboxChanged}
                    checked={_.sortedIndexOf(selectedAccounts, name) >= 0}
                    color="primary"/>
                }
                label={name}
            />
        )}

        <div style={{width: '100%', height: 60}}/>
        <Container style={{
            position: 'fixed',
            left: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            backgroundColor: "Window"
        }}>

            <Button style={bottomButtonStyle}
                    variant="outlined"
                    onClick={() => setSelectedAccounts(allAccounts.type === 'loaded' ? allAccounts.data : [])}>
                Select all
            </Button>

            <Button style={bottomButtonStyle} variant="outlined"
                    onClick={() => setSelectedAccounts([])}>Select none</Button>

            <Button style={bottomButtonStyle}
                    disabled={selectedAccounts.length === 0 || name.trim().length === 0 || isSaving}
                    onClick={handleSave}
                    color="primary" variant="contained">
                {isSaving ? 'Saving' : `Save (${selectedAccounts.length})`}
            </Button>

            <Button style={bottomButtonStyle}
                    onClick={onClose}
                    color="secondary" variant="contained">
                Cancel
            </Button>
        </Container>

        {pendingError.length > 0 &&
        <Snackbar
            open
            message={`Error: ${pendingError}`}
            autoHideDuration={3000}
            onClose={() => setPendingError('')}/>
        }
    </Container>
}
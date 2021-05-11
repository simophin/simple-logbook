import {AccountGroup} from "../models/AccountGroup";
import {Button, Form, Modal} from "react-bootstrap";
import {useCallback, useMemo, useState} from "react";
import {useObservable} from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import _ from "lodash";
import replaceAccountGroups from "../api/replaceAccountGroups";
import AlertDialog from "./AlertDialog";
import useAuthProps from "../hooks/useAuthProps";
import useAuthErrorReporter from "../hooks/useAuthErrorReporter";
import useObservableErrorReport from "../hooks/useObservableErrorReport";

type Props = {
    onClose: () => unknown,
    onFinish: () => unknown,
    editing?: AccountGroup,
};

export default function AccountGroupEntry({editing, onClose, onFinish}: Props) {
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState(editing?.groupName ?? '');
    const [accounts, setAccounts] = useState<string[]>(editing?.accounts ?? []);
    const [error, setError] = useState<string | undefined>();

    const authProps = useAuthProps();

    const allAccounts = useObservable(() => listAccounts({}, authProps), [authProps]);
    useObservableErrorReport(allAccounts);

    const accountOptions = useMemo(() => {
        if (allAccounts.type !== 'loaded') {
            return [];
        }

        return allAccounts.data.map(({name}) =>
            <option value={name}>{name}</option>);
    }, [allAccounts]);

    const isValid = name.trim().length > 0 && accounts.length > 0;

    const authErrorReporter = useAuthErrorReporter();
    const handleSave = useCallback(() => {
        const groups: AccountGroup[] = [];
        if (editing && editing.groupName.trim().toLowerCase() !== name.trim().toLowerCase()) {
            groups.push({
                ...editing,
                accounts: [],
            });
        }

        groups.push({
            groupName: name.trim(),
            accounts,
        });

        setSaving(true);
        replaceAccountGroups(groups, authProps)
            .subscribe(() => {
                setSaving(false);
                onFinish();
            }, (e: Error) => {
                setError(e?.message ?? 'Unknown error');
                setSaving(false);
                authErrorReporter(e);
            });

    }, [accounts, editing, name, onFinish, authProps, authErrorReporter]);

    return <>
        <Modal show onHide={onClose}>
            <Modal.Header>
                {editing ? 'Edit account group' : 'New account group'}
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>Group name</Form.Label>
                        <Form.Control
                            value={name}
                            required
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Accounts ({accounts.length} selected)</Form.Label>
                        <Form.Control
                            style={{minHeight: 300}}
                            as='select'
                            value={accounts}
                            required
                            multiple
                            onChange={(e) =>
                                setAccounts(
                                    _.map((e.target as HTMLSelectElement).selectedOptions, 'value'))}>
                            {accountOptions}
                        </Form.Control>
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button onClick={onClose}
                        disabled={saving}
                        variant='link'>
                    Close
                </Button>
                <Button onClick={handleSave}
                        disabled={!isValid || saving}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>

        {error && <AlertDialog body={error}
                               onCancel={() => setError(undefined)}
                               onOk={() => setError(undefined)}
                               cancelText=''/>
        }
    </>;
}
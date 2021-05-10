import {Button, Form, Modal, NavDropdown} from "react-bootstrap";
import {useContext, useState} from "react";
import AlertDialog from "../components/AlertDialog";
import useAuthProps from "../hooks/useAuthProps";
import updatePassword from "../api/updatePassword";
import {AppState} from "../state/AppState";


export default function ChangePasswordNavItem() {
    const [showing, setShowing] = useState(false);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState();

    const authProps = useAuthProps();
    const {setUserState} = useContext(AppState);

    const handleSave = () => {
        if (updating) {
            return;
        }

        setUpdating(true);
        updatePassword({
            oldPassword: oldPassword.length > 0 ? oldPassword : undefined,
            newPassword: newPassword.length > 0 ? newPassword : undefined,
            ...authProps
        })
            .subscribe(
                () => {
                    setShowing(false);
                    setUpdating(false);
                    if (newPassword.length === 0) {
                        setUserState(undefined);
                    }
                },
                (e) => {
                    setUpdating(false);
                    setError(e?.message ?? 'unknown error');
                }
            );
    };

    return <>
        <NavDropdown.Item onSelect={() => setShowing(true)}>
            Change password
        </NavDropdown.Item>

        {error && showing && <AlertDialog body={`Error saving password: ${error}`}
                                          onOk={() => setError(undefined)}
                                          onCancel={() => setError(undefined)}/>}

        {showing && <Modal show onHide={() => setShowing(false)}>
            <Modal.Header>Change password</Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>Old password</Form.Label>
                        <Form.Control type='password'
                                      value={oldPassword}
                                      onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <Form.Text>Leave empty if it's not set</Form.Text>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>New password</Form.Label>
                        <Form.Control type='password'
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}/>
                        <Form.Text>Leave empty to clear</Form.Text>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant='outline-primary'
                    disabled={updating}
                    onClick={() => setShowing(false)}>Cancel</Button>
                <Button variant='primary'
                        disabled={updating}
                        onClick={handleSave}>{updating ? 'Saving...' : 'Save'}</Button>
            </Modal.Footer>
        </Modal>}
    </>;
}
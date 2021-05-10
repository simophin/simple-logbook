import {useCallback, useContext, useState} from "react";
import {Button, Form, Modal} from "react-bootstrap";
import {AppState} from "../state/AppState";
import {signIn} from "../api/tokens";

type LoginState = {
    state: 'in_progress'
} | {
    state: 'error',
    message: string,
};

export default function Authenticator() {
    const [inputPassword, setInputPassword] = useState('');
    const {userState, setUserState} = useContext(AppState);
    const [loginState, setLoginState] = useState<LoginState>();
    const handleLogin = useCallback(() => {
        setLoginState({state: 'in_progress'});
        signIn({password: inputPassword})
            .subscribe(
                ({token}) => {
                    setUserState({state: 'with_token', token});
                    setLoginState(undefined);
                },
                (e) => {
                    setLoginState({state: 'error', message: e?.message ?? 'unknown error'});
                }
            )
    }, [inputPassword, setUserState]);

    return <>
        {userState?.state === 'auth_error' && <Modal show onHide={() => {
        }}>
            <Modal.Header>Enter your password to access</Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            value={inputPassword}
                            onChange={(e) => setInputPassword(e.target.value)}
                            type='password'
                            placeholder='password'/>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    disabled={loginState?.state === 'in_progress'}
                    onClick={handleLogin}>{loginState?.state === 'in_progress' ? 'Logging in...' : 'Log in'}</Button>
            </Modal.Footer>
        </Modal>
        }
    </>
}
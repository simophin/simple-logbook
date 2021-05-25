import {useCallback, useContext, useEffect, useState} from "react";
import {Button, Form, Modal} from "react-bootstrap";
import {AppStateContext} from "../state/AppStateContext";
import {refreshToken, signIn} from "../api/tokens";
import {timer} from "rxjs";
import useAuthErrorReporter from "../hooks/useAuthErrorReporter";
import {switchMap} from "rxjs/operators";
import {buildAuthProps} from "../hooks/useAuthProps";

type LoginState = {
    state: 'in_progress'
} | {
    state: 'error',
    message: string,
};

export default function Authenticator() {
    const [inputPassword, setInputPassword] = useState('');
    const {userState, setUserState} = useContext(AppStateContext);
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


    const currentToken = userState?.state === 'with_token' ? userState?.token : undefined;

    const reporter = useAuthErrorReporter();

    // Refresh token some time after we have the first one
    useEffect(() => {
        if (currentToken) {
            const sub = timer(60000)
                .pipe(switchMap(() => refreshToken(buildAuthProps(currentToken))))
                .subscribe(
                    ({token}) => {
                        setUserState({state: 'with_token', token});
                    },
                    reporter);
            return () => sub.unsubscribe();
        }
    }, [currentToken, reporter, setUserState]);

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
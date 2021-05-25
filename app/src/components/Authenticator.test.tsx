import {ReactElement} from "react";
import {AppStateContext, UserState} from "../state/AppStateContext";
import {render, waitFor} from "@testing-library/react";
import MockAdapter from 'axios-mock-adapter';
import axios from "axios";
import each from "jest-each";
import Authenticator from "./Authenticator";

export function testAuthHandling(factory: () => ReactElement) {
    let setUserState: jest.Mock<any, any>;
    let reportTransactionUpdated: jest.Mock<any, any>;
    let mock: MockAdapter;
    let requestSpy: any;

    beforeEach(() => {
        setUserState = jest.fn();
        reportTransactionUpdated = jest.fn();
        mock = new MockAdapter(axios);
        requestSpy = jest.spyOn(axios, 'request');

    });

    afterEach(() => {
        setUserState.mockClear();
        reportTransactionUpdated.mockClear();
        mock.restore();
        requestSpy.mockClear();
    });

    const testingUserStates: UserState[] = [
        {state: 'with_token', token: '1234'},
        undefined,
    ];

    each([
        [
            testingUserStates[0],
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer 1234",
                })
            })
        ],
        [
            testingUserStates[1],
            expect.not.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer 1234",
                })
            })
        ],
    ]).test('should request with/out auth headers', (userState: UserState, expected) => {
        requestSpy.mockImplementation(() => new Promise(() => {
        }));

        render(<AppStateContext.Provider
            value={{
                userState,
                setUserState,
                reportTransactionUpdated,
            }}>
            {factory()}
        </AppStateContext.Provider>);

        expect(requestSpy).toHaveBeenCalledWith(expected);
        expect(setUserState).toHaveBeenCalledTimes(0);
    });

    each(testingUserStates).test('should show authenticator dialog in 401', (userState: UserState) => {
        requestSpy.mockRestore();
        mock.onAny().reply(401);

        render(<AppStateContext.Provider
            value={{
                userState,
                setUserState,
                reportTransactionUpdated,
            }}>
            {factory()}
        </AppStateContext.Provider>);

        return waitFor(() => {
            expect(setUserState).toHaveBeenCalledWith({state: 'auth_error'} as UserState);
        });
    });
}

describe('<Authenticator />', function () {
    let setUserState: jest.Mock<any, any>;
    let reportTransactionUpdated: jest.Mock<any, any>;

    beforeEach(() => {
        setUserState = jest.fn();
        reportTransactionUpdated = jest.fn();
    });

    it('should render', function () {
        const userState: UserState = {state: 'auth_error'};

        render(<AppStateContext.Provider
            value={{
                userState,
                setUserState,
                reportTransactionUpdated,
            }}>
            <Authenticator />
        </AppStateContext.Provider>);
    });
});
import AccountGroupEntry from "./AccountGroupEntry";
import {render, screen} from "@testing-library/react";
import {AppStateContext} from "../state/AppStateContext";
import {unknown} from "io-ts";
import {testAuthHandling} from "./Authenticator.test";
import {of} from "rxjs";
import listAccounts from "../api/listAccount";
import {Account} from "../models/Account";

describe('<AccountGroupEntry />', function () {
    const handleOnClose = jest.fn();
    const handleOnFinish = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create new account', async () => {
        const accounts = ['First account', 'Second account'];

        const getAccounts: typeof listAccounts = jest.fn(() =>
            of(accounts.map((name) => ({name} as Account)))) as any;

        const {container} = render(<AppStateContext.Provider
            value={{
                userState: {state: 'with_token', token: '1234'},
                setUserState: () => unknown,
                reportTransactionUpdated: () => unknown,
            }}>
            <AccountGroupEntry
                getAccounts={getAccounts}
                onClose={handleOnClose}
                onFinish={handleOnFinish}/>
        </AppStateContext.Provider>);

        expect(screen.queryByText('New account group')).toBeTruthy();
        expect(screen.queryByText('Edit account group')).toBeFalsy();

        const saveButton = screen.getByText('Save') as HTMLButtonElement;
        expect(saveButton.disabled).toBeTruthy();

        // Select account
        // for (let i = 0; i < accounts.length; i++){
        //     const account = accounts[i];
        //     act(() => {
        //         userEvent.click(screen.getByText(account));
        //     });
        //     await waitFor(() => {
        //         expect(screen.getByText(/Accounts \(.*selected\)/).textContent)
        //             .toEqual(`Accounts (${i + 1} selected)`);
        //     });
        // }
    });
});

describe('<AccountGroupEntry /> auth handling', () => testAuthHandling(() => <AccountGroupEntry
    onClose={jest.fn()}
    onFinish={jest.fn()}/>
));
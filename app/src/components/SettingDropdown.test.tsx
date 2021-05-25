import {act, render, screen} from "@testing-library/react";
import {AppStateContext} from "../state/AppStateContext";
import {BrowserRouter} from "react-router-dom";
import SettingDropdown from "./SettingDropdown";

describe('<SettingDropDown />', function () {
    it('should have change password/logout', async function () {
        const reportTransactionUpdated = jest.fn();
        const setUserState = jest.fn();
        render(
            <BrowserRouter>
                <AppStateContext.Provider value={{
                    reportTransactionUpdated,
                    userState: {state: 'with_token', token: '12345'},
                    setUserState,
                } }>
                    <SettingDropdown/>
                </AppStateContext.Provider>
            </BrowserRouter>
        );
        act(() => screen.getByText('Settings').click());

        expect(screen.queryByText('Change password')).toBeTruthy();
        expect(screen.queryByText('Log out')).toBeTruthy();

        act(() => screen.getByText('Change password').click());
        expect(screen.queryByText('New password')).toBeTruthy();
        expect(screen.queryByText('Old password')).toBeTruthy();
        act(() => screen.getByText('Cancel').click());

        act(() => screen.getByText('Log out').click());
        expect(screen.queryByText('Are you sure to log out?')).toBeTruthy();
        act(() => screen.getByText('Cancel').click());
    });
});
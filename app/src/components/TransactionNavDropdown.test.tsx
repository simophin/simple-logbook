import { act, render, screen } from "@testing-library/react";
import { AppStateContext } from "../state/AppStateContext";
import TransactionNavDropdown from "./TransactionNavDropdown";
import { BrowserRouter } from "react-router-dom";

describe('<TransactionNavDropDown />', function () {
    it('should have add transaction', async function () {
        const reportTransactionUpdated = jest.fn();
        render(
            <BrowserRouter>
                <AppStateContext.Provider value={{
                    reportTransactionUpdated,
                } as unknown as any}>
                    <TransactionNavDropdown />
                </AppStateContext.Provider>
            </BrowserRouter>
        );
        act(() => screen.getByText('Transaction').click());

        expect(screen.queryByText('New transaction')).toBeTruthy();
        expect(screen.queryByText('Transactions')).toBeTruthy();
        expect(screen.queryByText('Accounts')).toBeTruthy();

        act(() => screen.getByText('New transaction').click());

        expect(screen.queryByText('Amount')).toBeTruthy();
    });
});
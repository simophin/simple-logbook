import {act, fireEvent, render, screen} from "@testing-library/react";
import WorkNavDropDown from "./WorkNavDropDown";
import userEvent from "@testing-library/user-event";
import {BrowserRouter} from "react-router-dom";

describe('<WorkNavDropDown />', function () {
    it('should render with start task', async function () {
        render(<BrowserRouter><WorkNavDropDown/></BrowserRouter>);
        userEvent.click(screen.getByText('Work'));

        act(() => {
            fireEvent.click(screen.getByText('Start time tracker'));
        });

        await userEvent.type(screen.getByPlaceholderText('Description'), 'Task');
        await userEvent.type(screen.getByPlaceholderText('Category'), 'Cat1');
        await userEvent.type(screen.getByPlaceholderText('Unit price'), '1.23');
        await userEvent.click(screen.getByText('Start'));

        expect(screen.queryByText('Start time tracker')).toBeFalsy();
        await userEvent.click(screen.getByText('Work'));

        act(() => {
            fireEvent.click(screen.getByText("Stop 'Task' (0m)"));
        });
        expect(screen.queryByText('Save timed task')).toBeTruthy();
    });

    it('should open expense dialog', function () {
        render(<BrowserRouter><WorkNavDropDown/></BrowserRouter>);
        userEvent.click(screen.getByText('Work'));

        act(() => {
            fireEvent.click(screen.getByText('Add an invoice item/expense'));
        });

        expect(screen.queryByText('Description')).toBeTruthy();
    });
});
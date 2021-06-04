import {render, screen} from "@testing-library/react";
import TimedTaskEntry from "./TimedTaskEntry";
import userEvent from "@testing-library/user-event";
import currency from 'currency.js';

describe('<TimedTaskEntry />', function () {
    it('should render', async function () {
        const onStarted = jest.fn();
        const onHide = jest.fn();
        render(<TimedTaskEntry onStarted={onStarted} onHide={onHide} />);

        await userEvent.type(screen.getByPlaceholderText('Description'), 'desc');
        await userEvent.type(screen.getByPlaceholderText('Category'), 'cat1');
        await userEvent.type(screen.getByPlaceholderText('Sub-category'), 'cat2');
        await userEvent.type(screen.getByPlaceholderText('Unit price'), '1.23');
        await userEvent.click(screen.getByText('Start'));

        expect(onStarted).toHaveBeenCalledWith(expect.objectContaining({
            description: 'desc',
            category: 'cat1',
            subCategory: 'cat2',
            unitPrice: currency('1.23'),
            date: expect.anything(),
        }));

        expect(onHide).toHaveBeenCalledTimes(1);
    });
});
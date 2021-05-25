import {AppState, AppStateContext} from "../state/AppStateContext";
import {render, screen} from "@testing-library/react";
import TimedTaskEntry from "./TimedTaskEntry";
import searchWorkLog from "../api/searchWorkLog";
import searchWorkLogCategory from "../api/searchWorkLogCategory";
import searchWorkLogSubCategory from "../api/searchWorkLogSubCategory";
import currency from 'currency.js';
import {ZonedDateTime} from "@js-joda/core";
import {NonEmptyString} from "io-ts-types";
import userEvent from "@testing-library/user-event";
import saveWorkLog from "../api/saveWorkLog";
import {of} from "rxjs";

describe('<TimedTaskEntry />', function () {

    const state: AppState = {
        reportTransactionUpdated: jest.fn(),
        setUserState: jest.fn(),
        userState: undefined
    };

    const onStarted = jest.fn();
    const onSaved = jest.fn();
    const onHide = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render start entry', async function () {
        const searchByDescription: jest.Mock<ReturnType<typeof searchWorkLog>> = jest.fn();
        const searchCategory: jest.Mock<ReturnType<typeof searchWorkLogCategory>> = jest.fn();
        const searchSubCategory: jest.Mock<ReturnType<typeof searchWorkLogSubCategory>> = jest.fn();
        render(<AppStateContext.Provider value={state}>
            <TimedTaskEntry
                onStarted={onStarted}
                searchByDescription={searchByDescription}
                searchCategory={searchCategory}
                searchSubCategory={searchSubCategory}
                onSaved={onSaved}
                onHide={onHide}/>
        </AppStateContext.Provider>);

        expect(screen.queryByText('New timed task')).toBeTruthy();
        expect(screen.queryByText('Description (*)')).toBeTruthy();
        expect(screen.queryByText('Category (*)')).toBeTruthy();
        expect(screen.queryByText('Subcategory')).toBeTruthy();
        expect(screen.queryByText('Hourly price (*)')).toBeTruthy();
        expect(screen.queryByText('Start')).toBeTruthy();

        await userEvent.type(screen.getByPlaceholderText('Enter your description'), 'desc');
        await userEvent.type(screen.getByPlaceholderText('Enter your category'), 'cat1');
        await userEvent.type(screen.getByPlaceholderText('Enter your subCategory'), 'cat2');
        await userEvent.type(screen.getByPlaceholderText('Enter your hourly price'), '1.23');
        await userEvent.click(screen.getByText('Start'));

        expect(onStarted).toHaveBeenCalledWith({
            description: 'desc',
            category: 'cat1',
            subCategory: 'cat2',
            unitPrice: currency(1.23),
            created: expect.any(ZonedDateTime),
        });
        expect(onHide).toBeCalled();
        expect(onSaved).not.toBeCalled();
    });

    it('should render finishing entry', async function () {
        const now = ZonedDateTime.now();
        const created = now.minusMinutes(40);
        const save: jest.Mock<ReturnType<typeof saveWorkLog>> = jest.fn();
        render(<AppStateContext.Provider value={state}>
            <TimedTaskEntry
                state={{
                    description: 'description' as NonEmptyString,
                    category: 'cat1' as NonEmptyString,
                    subCategory: 'cat2',
                    unitPrice: currency(12),
                    created,
                }}
                now={now}
                onStarted={onStarted}
                onSaved={onSaved}
                save={save}
                onHide={onHide}/>
        </AppStateContext.Provider>);

        expect(screen.queryByText('Finishing a timed task')).toBeTruthy();
        expect(screen.queryByText('Start time')).toBeTruthy();

        expect(screen.queryByText('Description (*)')).toBeTruthy();
        expect(screen.queryByDisplayValue('description')).toBeTruthy();

        expect(screen.queryByText('Category (*)')).toBeTruthy();
        expect(screen.queryByDisplayValue('cat1')).toBeTruthy();


        expect(screen.queryByText('Subcategory')).toBeTruthy();
        expect(screen.queryByDisplayValue('cat2')).toBeTruthy();

        expect(screen.queryByText('Hourly price (*)')).toBeTruthy();
        expect(screen.queryByDisplayValue('12.00')).toBeTruthy();

        expect(screen.queryByText('Hours (*)')).toBeTruthy();
        expect(screen.queryByDisplayValue('0.66')).toBeTruthy();

        expect(screen.queryByText('Rounding')).toBeTruthy();
        expect(screen.queryByText('Save')).toBeTruthy();

        // Check total price
        expect(screen.queryByDisplayValue(currency(7.92).format())).toBeTruthy();

        // Change rounding then test hours and price
        await userEvent.click(screen.getByText('15m'));
        expect(screen.queryByDisplayValue('0.75')).toBeTruthy();
        expect(screen.queryByDisplayValue(currency(9).format())).toBeTruthy();

        await userEvent.click(screen.getByText('30m'));
        expect(screen.queryByDisplayValue('1.00')).toBeTruthy();
        expect(screen.queryByDisplayValue(currency(12).format())).toBeTruthy();

        await userEvent.click(screen.getByText('1h'));
        expect(screen.queryByDisplayValue('1.00')).toBeTruthy();
        expect(screen.queryByDisplayValue(currency(12).format())).toBeTruthy();

        // Confirming
        save.mockImplementation(() => of(1));
        await userEvent.click(screen.getByText('Save'));
        expect(save).toBeCalledWith({
            description: 'description' as NonEmptyString,
            category: 'cat1' as NonEmptyString,
            subCategory: 'cat2',
            unitPrice: currency(12),
            attachments: [],
            created,
            unit: currency(1),
            id: expect.anything(),
        }, {});
        expect(onSaved).toBeCalled();
    });

    it('should editing entry', async function () {
        const now = ZonedDateTime.now();
        const created = now.minusMinutes(40);
        const save: jest.Mock<ReturnType<typeof saveWorkLog>> = jest.fn();
        render(<AppStateContext.Provider value={state}>
            <TimedTaskEntry
                state={{
                    id: '123' as NonEmptyString,
                    description: 'description' as NonEmptyString,
                    category: 'cat1' as NonEmptyString,
                    subCategory: 'cat2',
                    unitPrice: currency(101.0),
                    unit: currency(1.23),
                    created,
                }}
                now={now}
                onStarted={onStarted}
                onSaved={onSaved}
                save={save}
                onHide={onHide}/>
        </AppStateContext.Provider>);

        expect(screen.queryByText('Edit work log')).toBeTruthy();
        expect(screen.queryByText('Start time')).toBeTruthy();

        expect(screen.queryByText('Description (*)')).toBeTruthy();
        expect(screen.queryByDisplayValue('description')).toBeTruthy();

        expect(screen.queryByText('Category (*)')).toBeTruthy();
        expect(screen.queryByDisplayValue('cat1')).toBeTruthy();

        expect(screen.queryByText('Subcategory')).toBeTruthy();
        expect(screen.queryByDisplayValue('cat2')).toBeTruthy();

        expect(screen.queryByText('Hourly price (*)')).toBeTruthy();
        expect(screen.queryByDisplayValue(currency(101).toString())).toBeTruthy();

        expect(screen.queryByText('Hours (*)')).toBeTruthy();
        expect(screen.getByDisplayValue(currency(1.23).toString())).toBeTruthy();

        expect(screen.queryByText('Rounding')).toBeFalsy();
        expect(screen.queryByText('Save')).toBeTruthy();

        // Check total price
        expect(screen.queryByDisplayValue(currency(124.23).format())).toBeTruthy();

        // Confirming
        save.mockImplementation(() => of(1));
        await userEvent.click(screen.getByText('Save'));
        expect(save).toBeCalledWith({
            description: 'description' as NonEmptyString,
            category: 'cat1' as NonEmptyString,
            subCategory: 'cat2',
            unitPrice: currency(101),
            attachments: [],
            created,
            unit: currency(1.23),
            id: '123'
        }, {});
        expect(onSaved).toBeCalled();
    });
});
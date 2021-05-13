import {act, render, screen, waitFor} from "@testing-library/react";
import DateRangeSelect, {DateRange} from "./DateRangeSelect";
import {LocalDate} from "@js-joda/core";
import each from "jest-each";
import _ from "lodash";

describe('<DateRangeSelect />', function () {
    const today = LocalDate.now();
    const lastYear = today.minusYears(1).year();
    const currentYear = lastYear + 1;

    const options = [today.minusYears(1).year().toString(),
        today.year().toString(), 'Past 12 months', 'All'];

    const expectedForOptions: DateRange[] = [
        {
            start: LocalDate.of(lastYear, 1, 1),
            end: LocalDate.of(lastYear, 12, 31),
        },
        {
            start: LocalDate.of(currentYear, 1, 1),
        },
        {
            start: today.minusYears(1).withDayOfMonth(1),
        },
        {}
    ];

    it('should render', function () {
        render(<DateRangeSelect
            now={today}
            onChange={jest.fn()}/>);

        for (const option of options) {
            expect(screen.queryByText(option)).toBeTruthy();
        }
    });

    afterEach(() => {
    });

    each(_.zip(options, expectedForOptions)).test('should notify date range selected', function (option, expected) {
        const onChange = jest.fn();
        render(<DateRangeSelect
            now={today}
            onChange={onChange}/>);
        act(() => screen.getByText(option).click());
        expect(onChange).toHaveBeenCalledWith(expected);
    });


    each(_.zip(options, expectedForOptions)).test('should load/persist data', async function (option: string, expected: DateRange) {
        const {unmount, getByText} = render(<DateRangeSelect
            now={today}
            persistKey='test'
            onChange={jest.fn()}/>);

        act(() => getByText(option).click());
        unmount();

        const onChange = jest.fn();
        render(<DateRangeSelect
            now={today}
            persistKey='test'
            onChange={onChange}/>);

        await waitFor(() => expect(onChange).toBeCalledWith(expected));
    });

});
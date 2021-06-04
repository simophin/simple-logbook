import useFormField from "./useFormField";
import {act} from "@testing-library/react";
import {renderHook} from "@testing-library/react-hooks";
import each from "jest-each";

describe('useFormField', function () {
    each([
        {
            rules: {required: true},
            input: '',
            error: 'This field is required',
        },
        {
            rules: {required: true},
            input: ' ',
            error: 'Whitespaces are not allowed',
        },
        {
            rules: {required: true},
            input: 'Input ',
            error: null,
        },
        {
            rules: {required: false},
            input: '',
            error: null,
        },
        {
            rules: {required: true},
            input: ' ',
            error: 'Whitespaces are not allowed',
        },
        {
            rules: {required: true},
            input: 'Input ',
            error: null,
        },
        {
            rules: {pattern: /^\d+$/},
            input: '',
            error: 'Incorrect format',
        },
        {
            rules: {pattern: /^\d+$/},
            input: '1',
            error: null,
        },
        {
            rules: {pattern: /^\d+$/},
            input: ' ',
            error: 'Incorrect format',
        },
        {
            rules: {pattern: /^\d+$/},
            input: 'b',
            error: 'Incorrect format',
        },
        {
            rules: {type: 'number'},
            input: '',
            error: null,
        },
        {
            rules: {type: 'number'},
            input: '123',
            error: null,
        },
        {
            rules: {type: 'number'},
            input: 'b',
            error: 'This value is not a number',
        },
        {
            rules: {type: 'number', min: 1, max: 5},
            input: '1',
            error: null,
        },
        {
            rules: {type: 'number', min: 1, max: 5},
            input: '0',
            error: 'This value is less than min value allowed',
        },
        {
            rules: {type: 'number', min: 1, max: 5},
            input: '6',
            error: 'This value is bigger than max value allowed',
        },
    ]).test('should check for correct rules', ({rules, input, error}) => {
        let {result} = renderHook(() => useFormField('', rules));

        expect(result.current[2]).toBeNull();
        act(() => {
            result.current[1](input);
        });

        expect(result.current[2]).toBe(error);
    });

});
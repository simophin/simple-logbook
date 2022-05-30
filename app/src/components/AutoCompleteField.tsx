import { Observable, of } from "rxjs";
import { getLoadedValue, useObservable } from "../hooks/useObservable";
import { Ref, useState } from "react";
import { Either, left, right } from "fp-ts/Either";
import Autosuggest from "react-autosuggest";
import { useDebounce } from "../hooks/useDebounce";
import { Form, FormControlProps } from "react-bootstrap";

type Props<T> = Omit<Omit<Omit<Omit<FormControlProps, 'value'>, 'onChange'>, 'onBlur'>, 'children'> & {
    search: (term: string) => Observable<T[]>,
    onChange: (value: Either<string, T>) => unknown,
    getLabel: (v: T) => string,
    value: string | undefined,
    placeholder?: string,
    ref?: Ref<HTMLInputElement>,
    autoFocus?: boolean,
    required?: boolean,
    inputId?: string,
    isInvalid?: boolean,
};

export default function AutoCompleteField<T extends object>(
    { search, onChange, getLabel, value, size, inputId, ...inputProps }: Props<T>) {
    const [term, setTerm] = useState('');
    const debouncedTerm = useDebounce(term, 500);
    const rows = useObservable(
        () => debouncedTerm.trim().length > 0 ? search(debouncedTerm) : of([]),
        [debouncedTerm, search]
    );

    const theme = {
        container: 'autosuggest',
        input: 'form-control',
        suggestionsContainer: 'dropdown',
        suggestionsList: `dropdown-menu ${(getLoadedValue(rows)?.length ?? 0) > 0 ? 'show' : ''}`,
        suggestion: 'dropdown-item',
        suggestionHighlighted: 'active'
    };

    return <Autosuggest
        suggestions={rows.type === 'loaded' ? rows.data : []}
        onSuggestionsFetchRequested={({ value, reason }) => {
            if (reason === 'input-changed') {
                setTerm(value);
            }
        }}
        onSuggestionSelected={(e, d) => {
            onChange(right(d.suggestion));
        }}
        onSuggestionsClearRequested={() => setTerm('')}
        getSuggestionValue={getLabel}
        renderInputComponent={(p) =>
            <Form.Control type='input' {...p}
                id={inputId}
                size={size} />}
        theme={theme}
        inputProps={
            {
                value: value ?? '',
                onChange: (e) => {
                    const value: any = (e.target as HTMLInputElement).value;
                    if (typeof value === 'string') {
                        onChange(left(value));
                    }
                },
                ...inputProps,
            }
        }
        renderSuggestion={(value) => <span data-cy='suggestion-item'>{getLabel(value)}</span>}
    />
}
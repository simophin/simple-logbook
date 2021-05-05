import {Observable, of} from "rxjs";
import {useObservable} from "../hooks/useObservable";
import {Ref, useState} from "react";
import {Either, left, right} from "fp-ts/Either";
import Autosuggest from "react-autosuggest";
import {useDebounce} from "../hooks/useDebounce";
import {Form, FormControlProps} from "react-bootstrap";

type Props<T> = Omit<Omit<FormControlProps, 'value'>, 'onChange'> & {
    search: (term: string) => Observable<T[]>,
    onChange: (value: Either<string, T>) => unknown,
    getLabel: (v: T) => string,
    value: string | undefined,
    placeholder?: string,
    ref?: Ref<HTMLInputElement>,
    autofocus?: boolean,
};

export default function AutoCompleteField<T extends object>(
    {search, onChange, getLabel, value, size, ref, ...formProps}: Props<T>) {
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
        suggestionsList: `dropdown-menu ${rows.type === 'loaded' && rows.data.length > 0 ? 'show' : ''}`,
        suggestion: 'dropdown-item',
        suggestionHighlighted: 'active'
    };

    return <Autosuggest
        suggestions={rows.type === 'loaded' ? rows.data : []}
        onSuggestionsFetchRequested={({value, reason}) => {
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
                          size={size} />}
        theme={theme}
        inputProps={
            {
                value: value ?? '',
                onChange: (e) => {
                    onChange(left((e.target as HTMLInputElement).value));
                },
                ref,
                ...formProps
            }
        }
        renderSuggestion={(value) => <span>{getLabel(value)}</span>}
    />
}
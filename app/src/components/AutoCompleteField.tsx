import {Observable} from "rxjs";
import React, {CSSProperties, useState} from "react";
import {useDebounce} from "../hooks/useDebounce";
import {useObservable} from "../hooks/useObservable";
import {Autocomplete} from "@material-ui/lab";
import {TextField} from "@material-ui/core";

export type AutoCompleteFieldProps<SearchResult> = {
    label: string,
    fullWidth?: boolean,

    value?: string,
    onValueChanged: (v: string) => void,

    search: (term: string) => Observable<SearchResult[]>,
    onSearchResultSelected?: (r: SearchResult) => void,

    getSearchResultLabel: (s: SearchResult) => string,

    inputRef?: any,
    autoFocus?: boolean,
    style?: CSSProperties,
}

export function AutoCompleteField<SearchResult>({
                                                    getSearchResultLabel,
                                                    label,
                                                    onSearchResultSelected,
                                                    onValueChanged,
                                                    search,
                                                    value,
                                                    inputRef,
                                                    style,
                                                    fullWidth = true,
                                                    autoFocus = false
                                                }: AutoCompleteFieldProps<SearchResult>) {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 200);
    const searchResults = useObservable(() => search(debouncedSearchTerm), [debouncedSearchTerm]);

    return <Autocomplete
        onInputChange={(event, value) => {
            setSearchTerm(value);
            onValueChanged(value);
        }}
        onChange={((event, value) => {
            if (value && typeof value === 'object' && value.type === 'search-result' && onSearchResultSelected) {
                onSearchResultSelected(value.value);
            }
        })}
        loading={searchResults.type === 'loading'}
        onClose={() => setSearchTerm('')}
        inputValue={value}
        freeSolo={true}
        style={style}
        fullWidth={fullWidth}
        autoComplete={true}
        renderInput={(params) => (
            <TextField autoFocus={autoFocus} {...params}
                       variant="outlined"
                       label={label} inputRef={inputRef} InputLabelProps={{
                shrink: true,
            }}/>
        )}
        options={searchResults.type === 'loaded' ? searchResults.data.map((value) => {
            return {
                type: 'search-result',
                value,
            };
        }) : []}
        getOptionLabel={(v) => getSearchResultLabel(v.value)}
        getOptionSelected={(option, value) => option.value === value.value}
    />;
}
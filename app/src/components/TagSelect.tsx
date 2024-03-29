import { NonEmptyString } from "io-ts-types";
import { useState } from "react";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import { map } from "rxjs/operators";
import { listTag } from "../api/listTag";
import useAuthProps from "../hooks/useAuthProps";
import { getLoadedValue, useObservable } from "../hooks/useObservable";
import useObservableErrorReport from "../hooks/useObservableErrorReport";

type Props = {
    id?: string;
    tags: NonEmptyString[];
    onChanged: (tags: NonEmptyString[]) => unknown;
    allowNew?: boolean;
}

export default function TagSelect({ id, tags, onChanged, allowNew }: Props) {
    const authProps = useAuthProps();
    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const tagSearchResult = useObservable(() => {
        return listTag({ q: tagSearchQuery.trim().length > 0 ? tagSearchQuery.trim() : undefined }, authProps)
            .pipe(map(({ data }) => data));
    }, [authProps, tagSearchQuery]);
    useObservableErrorReport(tagSearchResult);

    const options = getLoadedValue(tagSearchResult)?.map(({ tag }) => tag)?.concat(...tags) ?? [];
    return <AsyncTypeahead
        id={id}
        isLoading={tagSearchResult.type === 'loading'}
        options={options}
        onSearch={setTagSearchQuery}
        multiple
        allowNew={allowNew}
        selected={tags}
        minLength={0}
        onChange={(options) => {
            onChanged(options.map(o => {
                if (typeof o === 'string') {
                    return o as NonEmptyString;
                } else {
                    return ((o as unknown as any).label) as NonEmptyString;
                }
            }))
        }}
        size='sm'
    />
}
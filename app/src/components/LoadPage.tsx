import React, {useState} from "react";
import {Observable} from "rxjs";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import {Alert, Button, Spinner} from "react-bootstrap";
import useObservableErrorReport from "../hooks/useObservableErrorReport";


export default function LoadPage<LoadingProps, LoadedProps, InputProps = {}>({inputProps, loader, loadingProps, element}: {
    loadingProps: LoadingProps,
    inputProps?: InputProps,
    loader: (input: LoadingProps) => Observable<LoadedProps>,
    element: (props: LoadedProps & (InputProps | {})) => React.ReactElement,
}) {
    const [retrySeq, setRetrySeq] = useState(0);
    const rs = useObservable(() => loader(loadingProps), [retrySeq]);
    useObservableErrorReport(rs);
    const data = getLoadedValue(rs);

    if (data) {
        return element({...data, ...inputProps});
    } else if (rs.type === 'loading') {
        return <Spinner animation={'border'} />
    } else if (rs.type === 'error') {
        return <Alert variant='danger'>
            Error: ${rs.error?.message ?? 'Unknown error'}
            <div><Button onClick={() => setRetrySeq(retrySeq + 1)}>Retry</Button></div>
        </Alert>
    } else {
        return null;
    }
}
import type {Props as AlertDialogProps} from './AlertDialog';
import {Observable} from "rxjs";
import {useCallback, useState} from "react";
import AlertDialog from "./AlertDialog";

type Props = Omit<Omit<AlertDialogProps, 'okLoading'>, 'onOk'> & {
    doConfirm: () => Observable<unknown>,
    confirmInProgressText: string,
    onConfirmed?: () => unknown,
    errorTitle?: string,
};

export default function AsyncConfirm(
    {doConfirm, confirmInProgressText, errorTitle = 'Error', onConfirmed, ...props}: Props) {
    const [inProgress, setInProgress] = useState(false);

    const [error, setError] = useState('');

    const handleOk = useCallback(() => {
        setInProgress(true)
        doConfirm().subscribe(
            () => {
                setInProgress(false);
                if (onConfirmed) {
                    onConfirmed();
                }
            },
            (e: Error | undefined) => {
                setInProgress(false);
                setError(`${errorTitle}: ${e?.message ?? 'unknown error'}`);
            }
        )
    }, [doConfirm, errorTitle, onConfirmed]);

    return <>
        <AlertDialog {...props}
                     onOk={handleOk}
                     okLoading={inProgress ? confirmInProgressText : undefined}
        />

        {error.length > 0 &&
        <AlertDialog
            body={error}
            cancelText=''
            onOk={() => setError('')}
        />
        }
    </>
}
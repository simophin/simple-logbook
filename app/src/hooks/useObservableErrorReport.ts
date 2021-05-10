import {State} from "./useObservable";
import useAuthErrorReporter from "./useAuthErrorReporter";
import {useEffect} from "react";

export default function useObservableErrorReport(v: State<unknown>) {
    const reporter = useAuthErrorReporter();
    useEffect(() => {
        if (v.type === 'error') {
            reporter(v.error);
        }
    }, [reporter, v]);
}
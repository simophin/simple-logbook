import {NavDropdown} from "react-bootstrap";
import {useEffect, useState} from "react";
import TimedTaskEntry, {computeDuration, timedTaskStateType} from "./TimedTaskEntry";
import {interval} from "rxjs";
import {startWith} from "rxjs/operators";
import {usePersistedState} from "../hooks/usePersistedState";


export default function WorkNavDropDown() {
    const [taskStartedState, setTaskState] = usePersistedState('work-nav-task-state', timedTaskStateType);
    const [showingTimedEntry, setShowingTimedEntry] = useState(false);
    const [workDuration, setWorkDuration] = useState('');

    useEffect(() => {
        if (taskStartedState) {
            const sub = interval(60000)
                .pipe(startWith(0))
                .subscribe(() => setWorkDuration(computeDuration(taskStartedState)));

            return () => sub.unsubscribe();
        }
    }, [taskStartedState])

    return <NavDropdown id='nav-work' title='Work'>
        {!taskStartedState && <NavDropdown.Item onClick={() => setShowingTimedEntry(true)}>
            Start a timed task
        </NavDropdown.Item>}

        {taskStartedState && <NavDropdown.Item onClick={() => setShowingTimedEntry(true)}>
            Stop '{taskStartedState.description}' ({workDuration})
        </NavDropdown.Item>}

        {showingTimedEntry &&
        <TimedTaskEntry
            onStarted={setTaskState}
            onSaved={() => setTaskState(undefined)}
            state={taskStartedState}
            onHide={() => setShowingTimedEntry(false)}/>}
    </NavDropdown>;
}
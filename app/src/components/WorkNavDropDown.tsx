import {NavDropdown} from "react-bootstrap";
import {useEffect, useState} from "react";
import TimedTaskEntry, {computeDuration, timedTaskStateType} from "./TimedTaskEntry";
import {interval} from "rxjs";
import {startWith} from "rxjs/operators";
import {usePersistedState} from "../hooks/usePersistedState";
import {LinkContainer} from "react-router-bootstrap";
import {useLocation} from "react-router-dom";
import InvoiceItemEntry from "./InvoiceItemEntry";


export default function WorkNavDropDown() {
    const [taskStartedState, setTaskState] = usePersistedState('work-nav-task-state', timedTaskStateType);
    const [showingTimedEntry, setShowingTimedEntry] = useState(false);
    const [showingCompleteTimedEntry, setShowingCompleteTimedEntry] = useState(false);
    const [workDuration, setWorkDuration] = useState('');
    const [addingExpense, setAddingExpense] = useState(false);

    const location = useLocation();

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
            Start time tracker
        </NavDropdown.Item>}

        {taskStartedState && <NavDropdown.Item onClick={() => setShowingCompleteTimedEntry(true)}>
            Stop '{taskStartedState.description}' ({workDuration})
        </NavDropdown.Item>}

        <NavDropdown.Item onClick={() => setAddingExpense(true)}>
            Add an invoice item/expense
        </NavDropdown.Item>

        {addingExpense && <InvoiceItemEntry
            draft={{state: 'new', category: 'Expenses'}}
            onHide={() => setAddingExpense(false)}
        />}

        {showingCompleteTimedEntry && taskStartedState && <InvoiceItemEntry
            draft={{state: 'timer', ...taskStartedState}}
            onSubmitted={() => {
                setTaskState(undefined);
                setShowingTimedEntry(true);
            }}
            onHide={() => setShowingCompleteTimedEntry(false)}
        />}

        <LinkContainer to='/invoices'>
            <NavDropdown.Item
                active={location.pathname === '/invoices'}>
                List past invoices
            </NavDropdown.Item>
        </LinkContainer>

        <LinkContainer to='/invoice/add'>
            <NavDropdown.Item
                active={location.pathname === '/invoice/add'}>
                Generate an invoice
            </NavDropdown.Item>
        </LinkContainer>

        {showingTimedEntry &&
        <TimedTaskEntry
            onStarted={setTaskState}
            onHide={() => setShowingTimedEntry(false)}/>}
    </NavDropdown>;
}
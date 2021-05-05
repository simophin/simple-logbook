import {DropdownButton, Nav, Navbar} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap';
import TransactionListPage from "./pages/TransactionListPage";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import AccountListPage from "./pages/AccountListPage";
import DropdownItem from "react-bootstrap/DropdownItem";
import {useMemo, useState} from "react";
import TransactionEntry from "./components/TransactionEntry";
import {TransactionStateContext} from "./state/TransactionState";
import {BehaviorSubject} from "rxjs";

function App() {
    let [addingTransaction, setAddingTransaction] = useState(false);
    let transactionState = useMemo(() => new BehaviorSubject<unknown>(undefined), []);

    return <Router>
        <Navbar expand='md'>
            <Navbar.Brand>Logbook</Navbar.Brand>
            <Navbar.Collapse>
                <Nav>
                    <LinkContainer to='/'>
                        <Nav.Link>Transactions</Nav.Link>
                    </LinkContainer>
                    <LinkContainer to='/accounts'>
                        <Nav.Link>Accounts</Nav.Link>
                    </LinkContainer>
                </Nav>
            </Navbar.Collapse>
            <DropdownButton title='Add' size='sm' menuAlign='right'>
                <DropdownItem onClick={() => setAddingTransaction(true)}>
                    Transaction
                </DropdownItem>
            </DropdownButton>
        </Navbar>

        <TransactionStateContext.Provider value={transactionState}>
            <Switch>
                <Route path="/accounts"><AccountListPage/></Route>
                <Route path="/"><TransactionListPage/></Route>
            </Switch>
        </TransactionStateContext.Provider>

        {addingTransaction && <TransactionEntry
            onFinish={() => {
                transactionState.next(undefined);
                setAddingTransaction(false);
            }}
            onClose={() => setAddingTransaction(false)} />
        }
    </Router>
}

export default App;
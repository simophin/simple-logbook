import {DropdownButton, Nav, Navbar, NavDropdown} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Route, Switch, useLocation} from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap';
import TransactionListPage from "./pages/TransactionListPage";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import AccountListPage from "./pages/AccountListPage";
import DropdownItem from "react-bootstrap/DropdownItem";
import {useMemo, useState} from "react";
import TransactionEntry from "./components/TransactionEntry";
import {TransactionStateContext} from "./state/TransactionState";
import {BehaviorSubject} from "rxjs";
import {useMediaPredicate} from "react-media-hook";
import SpendingReportPage from "./pages/SpendingReportPage";
import qs from 'qs';
import _ from "lodash";

function App() {
    let [addingTransaction, setAddingTransaction] = useState(false);
    let transactionState = useMemo(() => new BehaviorSubject<unknown>(undefined), []);

    const bigScreen = useMediaPredicate('(min-width: 420px)');
    const location = useLocation();

    return <>
        <Navbar expand={bigScreen} collapseOnSelect>
            <Navbar.Brand>Logbook</Navbar.Brand>
            <Navbar.Toggle/>
            <Navbar.Collapse>
                <Nav>
                    <LinkContainer to='/'>
                        <Nav.Link active={location.pathname === '/' || location.pathname === '/transactions'}>
                            Transactions
                        </Nav.Link>
                    </LinkContainer>
                    <LinkContainer to='/accounts'>
                        <Nav.Link active={location.pathname === '/accounts'}>Accounts</Nav.Link>
                    </LinkContainer>
                    <NavDropdown id="nav-dropdown" title='Reports'>
                        <LinkContainer to='/reports/spending'>
                            <NavDropdown.Item
                                active={location.pathname === '/reports/spending'}>
                                Spending
                            </NavDropdown.Item>
                        </LinkContainer>
                    </NavDropdown>
                </Nav>

            </Navbar.Collapse>

            {bigScreen && <DropdownButton title='Add' size='sm' menuAlign='right'>
                <DropdownItem onClick={() => setAddingTransaction(true)}>
                    Transaction
                </DropdownItem>
            </DropdownButton>}
        </Navbar>

        <TransactionStateContext.Provider value={transactionState}>
            <Switch>
                <Route path="/reports/spending" exact><SpendingReportPage/></Route>
                <Route path="/accounts"><AccountListPage/></Route>
                <Route path="/transactions">
                    {(props) => {
                        const query = qs.parse(props.location.search.substr(1), {parseArrays: true});
                        let accounts: string[] | undefined;
                        if (typeof query.account === 'string') {
                            accounts = [query.account];
                        } else if (_.isArray(query.accounts)) {
                            accounts = query.accounts as string[];
                        }
                        return <TransactionListPage
                            accounts={accounts}
                            showNewButton={!bigScreen}/>;
                    }}

                </Route>
                <Route path="/"><TransactionListPage showNewButton={!bigScreen}/></Route>
            </Switch>
        </TransactionStateContext.Provider>

        {addingTransaction && <TransactionEntry
            onFinish={() => {
                transactionState.next(undefined);
                setAddingTransaction(false);
            }}
            onClose={() => setAddingTransaction(false)}/>
        }
    </>
}

export default App;
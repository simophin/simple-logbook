import {Nav, Navbar, NavDropdown} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Route, Switch, useLocation} from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap';
import TransactionListPage from "./pages/TransactionListPage";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import AccountListPage from "./pages/AccountListPage";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useMediaPredicate} from "react-media-hook";
import IncomeExpenseChart from "./pages/IncomeExpenseChart";
import qs from 'qs';
import _ from "lodash";
import {AppStateContext, UserState} from "./state/AppStateContext";
import Authenticator from "./components/Authenticator";
import BalanceChart from "./pages/BalanceChart";
import WorkNavDropDown from "./components/WorkNavDropDown";
import TransactionNavDropdown from "./components/TransactionNavDropdown";
import SettingDropdown from "./components/SettingDropdown";
import InvoiceEntryPage, {InvoiceEditPage} from "./pages/InvoiceEntryPage";
import InvoiceViewPage from "./pages/InvoiceViewPage";
import InvoiceListView from "./components/InvoiceListView";


function App() {
    let [userState, setUserState] = useState<UserState>(() => {
        const v = localStorage.getItem('user_state');
        if (v) {
            return JSON.parse(v);
        }
    });
    let [transactionUpdatedTime, setTransactionUpdatedTime] = useState<number | undefined>(undefined);

    const bigScreen = useMediaPredicate('(min-width: 420px)');
    const location = useLocation();
    const fullScreen = /fullScreen=true/.test(location.search);

    const reportTransactionUpdated = useCallback(() => {
        setTransactionUpdatedTime(Date.now())
    }, []);

    const handleSetUserState = useCallback((n: UserState) => {
        setUserState(n);
    }, []);

    // Handle user state persistent
    useEffect(() => {
        if (userState) {
            localStorage.setItem('user_state', JSON.stringify(userState));
        } else {
            localStorage.removeItem('user_state');
        }
    }, [userState]);

    const appStateValue = useMemo(() => ({
        userState, transactionUpdatedTime, setUserState: handleSetUserState, reportTransactionUpdated
    }), [handleSetUserState, reportTransactionUpdated, transactionUpdatedTime, userState]);

    return <AppStateContext.Provider value={appStateValue}>
        {!fullScreen && <Navbar expand={bigScreen} collapseOnSelect>
            <Navbar.Brand>Logbook</Navbar.Brand>
            <Navbar.Toggle/>
            <Navbar.Collapse>
                <Nav>
                    <TransactionNavDropdown/>

                    <NavDropdown id="nav-chart" title='Chart'>
                        <LinkContainer to='/charts/income_expense'>
                            <NavDropdown.Item
                                active={location.pathname === '/charts/income_expense'}>
                                Income vs Expense
                            </NavDropdown.Item>
                        </LinkContainer>
                        <LinkContainer to='/charts/balance'>
                            <NavDropdown.Item
                                active={location.pathname === '/charts/balance'}>
                                Balance
                            </NavDropdown.Item>
                        </LinkContainer>
                    </NavDropdown>
                    <WorkNavDropDown/>
                    <SettingDropdown/>
                </Nav>

            </Navbar.Collapse>
        </Navbar>}


        <Switch>
            <Route path="/charts/income_expense" exact><IncomeExpenseChart/></Route>
            <Route path="/charts/balance" exact><BalanceChart/></Route>
            <Route path="/accounts"><AccountListPage/></Route>
            <Route path="/invoices"><InvoiceListView /></Route>
            <Route path="/invoice/add"><InvoiceEntryPage /></Route>
            <Route path="/invoice/edit/:id"><InvoiceEditPage /></Route>
            <Route path="/invoice/view/:id"><InvoiceViewPage /></Route>
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
            <Route path="/"><TransactionListPage/></Route>
        </Switch>

        <Authenticator/>
    </AppStateContext.Provider>
}

export default App;
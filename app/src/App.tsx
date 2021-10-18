import {Nav, Navbar, NavDropdown} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Route, Switch, useLocation} from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap';
import TransactionListPage from "./pages/TransactionListPage";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import AccountListPage from "./pages/AccountListPage";
import {useCallback, useMemo, useState} from "react";
import {useMediaPredicate} from "react-media-hook";
import IncomeExpenseChart from "./pages/IncomeExpenseChart";
import qs from 'qs';
import _ from "lodash";
import {AppStateContext, UserState, userStateType} from "./state/AppStateContext";
import Authenticator from "./components/Authenticator";
import BalanceChart from "./pages/BalanceChart";
import TransactionNavDropdown from "./components/TransactionNavDropdown";
import SettingDropdown from "./components/SettingDropdown";
import {usePersistedState} from "./hooks/usePersistedState";
import AttachmentListPage from "./pages/AttachmentListPage";


function App() {
    let [transactionUpdatedTime, setTransactionUpdatedTime] = useState<number | undefined>(undefined);
    let [userState, setUserState] = usePersistedState('user_state', userStateType, undefined);
    const bigScreen = useMediaPredicate('(min-width: 420px)');
    const location = useLocation();

    const queryString = location.search;
    const {fullScreen, token} = useMemo(() => {
        const params = new URLSearchParams(queryString);
        return {
            fullScreen: params.get('fullScreen') === 'true',
            token: params.get('token') ?? '',
        }
    }, [queryString]);


    const reportTransactionUpdated = useCallback(() => {
        setTransactionUpdatedTime(Date.now())
    }, []);


    const appStateValue = useMemo(() => ({
        userState: (token ? {state: 'with_token', token} : userState) as UserState,
        transactionUpdatedTime,
        setUserState: token ? () => {} : setUserState,
        reportTransactionUpdated
    }), [token, userState, transactionUpdatedTime, setUserState, reportTransactionUpdated]);

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
                    <SettingDropdown/>
                </Nav>

            </Navbar.Collapse>
        </Navbar>}


        <Switch>
            <Route path="/charts/income_expense" exact><IncomeExpenseChart/></Route>
            <Route path="/charts/balance" exact><BalanceChart/></Route>
            <Route path="/accounts"><AccountListPage/></Route>
            <Route path="/attachments"><AttachmentListPage /></Route>
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
                        accounts={accounts}/>;
                }}

            </Route>
            <Route path="/"><TransactionListPage/></Route>
        </Switch>

        <Authenticator/>
    </AppStateContext.Provider>
}

export default App;

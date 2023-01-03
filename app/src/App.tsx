import { Nav, Navbar, NavDropdown } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import TransactionListPage from "./pages/TransactionListPage";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-bootstrap-typeahead/css/Typeahead.bs5.css';
import AccountListPage from "./pages/AccountListPage";
import { useCallback, useMemo, useState } from "react";
import { useMediaPredicate } from "react-media-hook";
import IncomeExpenseChart from "./pages/IncomeExpenseChart";
import qs from 'qs';
import _ from "lodash";
import { AppStateContext, UserState, userStateType } from "./state/AppStateContext";
import Authenticator from "./components/Authenticator";
import BalanceChart from "./pages/BalanceChart";
import TransactionNavDropdown from "./components/TransactionNavDropdown";
import SettingDropdown from "./components/SettingDropdown";
import { usePersistedState } from "./hooks/usePersistedState";
import AttachmentListPage from "./pages/AttachmentListPage";
import TagListPage from "./pages/TagListPage";


function App() {
    let [transactionUpdatedTime, setTransactionUpdatedTime] = useState<number | undefined>(undefined);
    let [userState, setUserState] = usePersistedState('user_state', userStateType, undefined);
    const bigScreen = useMediaPredicate('(min-width: 420px)');
    const location = useLocation();

    const queryString = location.search;
    const { fullScreen, token } = useMemo(() => {
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
        userState: (token ? { state: 'with_token', token } : userState) as UserState,
        transactionUpdatedTime,
        setUserState: token ? () => { } : setUserState,
        reportTransactionUpdated
    }), [token, userState, transactionUpdatedTime, setUserState, reportTransactionUpdated]);

    return <AppStateContext.Provider value={appStateValue}>
        {!fullScreen && <Navbar expand={bigScreen} collapseOnSelect>
            <Navbar.Brand>Logbook</Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse>
                <Nav>
                    <TransactionNavDropdown />

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
                    <SettingDropdown />
                </Nav>

            </Navbar.Collapse>
        </Navbar>}


        <Routes>
            <Route path="/charts/income_expense" element={<IncomeExpenseChart />} />
            <Route path="/charts/balance" element={<BalanceChart />} />
            <Route path="/accounts" element={<AccountListPage />} />
            <Route path="/attachments" element={<AttachmentListPage />} />
            <Route path="/transactions" element={<TransactionListPageWithArgs />} />
            <Route path="/tags" element={<TagListPage />} />
            <Route path="/" element={<TransactionListPage />} />
        </Routes>

        <Authenticator />
    </AppStateContext.Provider>
}

function TransactionListPageWithArgs() {
    const query = qs.parse(window.location.search.substr(1), { parseArrays: true });
    let accounts: string[] | undefined;
    let tags: string[] | undefined;
    if (typeof query.account === 'string') {
        accounts = [query.account];
    } else if (_.isArray(query.accounts)) {
        accounts = query.accounts as string[];
    }

    if (typeof query.tag === 'string') {
        tags = [query.tag];
    } else if (_.isArray(query.tags)) {
        tags = query.tags as string[];
    }

    return <TransactionListPage
        tags={tags}
        accounts={accounts} />;
}

export default App;

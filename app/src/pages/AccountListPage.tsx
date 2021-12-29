import { flexContainer, flexFullLineItem } from "../styles/common";
import AccountGroupSelect from "../components/AccountGroupSelect";
import { useContext, useMemo, useState } from "react";
import { AccountGroup } from "../models/AccountGroup";
import { getLoadedValue, useObservable } from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import { Table } from "react-bootstrap";
import { Link } from 'react-router-dom';
import useAuthProps from "../hooks/useAuthProps";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import { Helmet } from "react-helmet";
import { AppStateContext } from "../state/AppStateContext";
import _ from "lodash";
import { formatAsCurrency } from "../utils/numeric";
import { Sort } from "../api/commonList";
import SortColumn from "../components/SortColumn";


export default function AccountListPage() {
    const [accountGroup, setAccountGroup] = useState<AccountGroup | undefined>();
    const [sort, setSort] = useState<Sort>();
    const authProps = useAuthProps();
    const { transactionUpdatedTime } = useContext(AppStateContext);
    const allAccounts = useObservable(() => listAccounts({
        includes: accountGroup?.accounts,
        sorts: sort ? [sort] : undefined,
    }, authProps), [accountGroup, authProps, transactionUpdatedTime, sort]);
    useObservableErrorReport(allAccounts);

    const children = useMemo(() => {
        return (getLoadedValue(allAccounts) ?? [])
            .map(({ name, balance }) =>
                <tr key={`account-${name}`}>
                    <td><Link to={`/transactions?account=${encodeURIComponent(name)}`}>{name}</Link></td>
                    <td>{formatAsCurrency(balance)}</td>
                </tr>
            );
    }, [allAccounts]);


    return <div style={flexContainer}>
        <Helmet><title>Accounts</title></Helmet>
        {_.isEqual(getLoadedValue(allAccounts), []) && <div style={flexFullLineItem}>No accounts found. Start by adding a new transaction.</div>}

        {children.length > 0 && <>
            <AccountGroupSelect
                persistKey='account-list-group'
                style={{ padding: 0 }}
                onChange={setAccountGroup} />

            <div style={flexFullLineItem}>
                <Table hover striped bordered size='sm'>
                    <thead>
                        <tr>
                            <th>
                                <SortColumn label='Account'
                                    order={sort?.field === 'name' ? sort.order : undefined}
                                    onChanged={order => setSort(order ? { field: 'name', order } : undefined)}
                                />
                            </th>
                            <th>
                                <SortColumn label='Balance'
                                    order={sort?.field === 'balance' ? sort.order : undefined}
                                    onChanged={order => setSort(order ? { field: 'balance', order } : undefined)}
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {children}
                    </tbody>
                </Table>
            </div>
        </>
        }
    </div>;
}